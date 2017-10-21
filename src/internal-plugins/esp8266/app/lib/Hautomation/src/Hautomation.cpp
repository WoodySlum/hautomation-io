#include "Hautomation.h"

int MAX_TIME_CONNECTION_ATTEMPT = 30; // In seconds
int MAX_TIME_SLEEP = 70 * 60;
int HTTP_SENSOR_TIMEOUT = 20;
int HTTP_PING_TIMEOUT = 5;
ESP8266WebServer httpServer(80);
ESP8266HTTPUpdateServer httpUpdater;
DynamicJsonBuffer sensorBuffer;
JsonObject& sensorValues = sensorBuffer.createObject();
DynamicJsonBuffer configBuffer;
JsonVariant config;

int poweredMode = 3;
int sleepTime = 30;


// Measure vcc
ADC_MODE(ADC_VCC);

Hautomation::Hautomation()
{

}

void Hautomation::setup(String jsonConfiguration)
{
    Serial.begin(115200);

    config = NULL;

    delay(5000);
    parseConfig(jsonConfiguration);
    delay(500);
    Serial.println("Hautomation ESP8266 library");
    Serial.println("Configuration : ");
    Serial.println(jsonConfiguration);

    checkRun();
    connect();
}

JsonObject &Hautomation::parseJson(DynamicJsonBuffer &jsonBuffer, String json) {
    JsonObject &root = jsonBuffer.parseObject(json);
    if (!root.success()) {
        Serial.println("Error : parseObject() failed");
    }

    return root;
}

void Hautomation::parseConfig(String jsonConfiguration) {
    config = parseJson(configBuffer, jsonConfiguration);
}

JsonVariant &Hautomation::getConfig() {
    return config;
}

void Hautomation::connect() {
    if (WiFi.status() != WL_CONNECTED) {
        #ifdef ESP8266
            WiFi.hostname("DEMO_HAUTOMATION");
        #endif

            const char* ssid = config["wifi"]["ssid"];
            const char* passphrase = config["wifi"]["passphrase"];

            Serial.println("SSID : " + String(ssid));
            //Serial.println("Passphrase : " + String(passphrase));
            WiFi.begin(ssid, passphrase);
            int counter = 0;
            while ((WiFi.status() != WL_CONNECTED) && (counter < MAX_TIME_CONNECTION_ATTEMPT)) {
                delay(500);
                Serial.print(".");
                counter++;
            }
            if (counter >= MAX_TIME_CONNECTION_ATTEMPT) {
                Serial.println("Connection failed. Trying again in 10 minutes");
                rest(0, 10 * 60);
                return;
            }

            Serial.println("");
            Serial.println("WiFi connected");
    } else {
        Serial.println("Already connected");
    }

    // Print the IP address
    Serial.println(WiFi.localIP());

    // Start update server
    if (canRunHttpServer()) {
        httpUpdateServer();
    }
}

void Hautomation::checkRun() {
    //sleepTime
    if (sleepTime <= MAX_TIME_SLEEP) {

    } else {
        int tick = loadCounter();
        long elapsedTime = tick * sleepTime;
        if (elapsedTime >= sleepTime) {
            saveCounter(0);
        } else {
            long newSleepTime = sleepTime;
            if ((sleepTime - elapsedTime) <= MAX_TIME_SLEEP) {
                newSleepTime = (sleepTime - elapsedTime);
            }
            tick++;
            saveCounter(tick);
            rest(poweredMode, newSleepTime);
        }
    }
}

String Hautomation::baseUrl() {

    const char* ip = config["ip"];
    int port = config["port"];

    return String("http://" + String(ip) + ":" + String(port) + "/api/");
}

void Hautomation::httpUpdateServer() {

    httpUpdater.setup(&httpServer);
    httpServer.begin();

    MDNS.addService("http", "tcp", 80);
    httpServer.on("/reboot", [](){
        Serial.println("Rebooting ...");
        httpServer.send(200, "text/html", "Rebooting, please wait ...");
        ESP.reset();
    });

    httpServer.on("/values", [](){
        String values;
        sensorValues.printTo(values);
        httpServer.send(200, "application/json", values);
    });

    Serial.println("HTTP server ready");
}

void Hautomation::ping() {
    const char* id = config["id"];
    String ip = WiFi.localIP().toString();
    long freeHeap = ESP.getFreeHeap();

    DynamicJsonBuffer pingBuffer;
    JsonObject& pingData = pingBuffer.createObject();
    pingData["ip"] = ip.c_str();
    pingData["freeHeap"] = freeHeap;

    transmit(baseUrl() + "esp/ping/" + String(id) + "/", pingData, HTTP_PING_TIMEOUT);
}

void Hautomation::transmit(String url, JsonObject& jsonObject, int timeout) {
    String data;
    jsonObject.printTo(data);

    Serial.println("Calling " + url + " with data " + data);
    HTTPClient http;
    http.setTimeout(timeout);
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.POST(data);
    http.writeToStream(&Serial);
    String payload = http.getString();
    Serial.println(payload);
    http.end();
}

void Hautomation::postSensorValue(String sensorType, float value) {
    String id = config["id"];
    String vcc = String(ESP.getVcc() / 1000);
    String url = baseUrl() + "esp/sensor/set/" + id + "/" + sensorType + "/" + String(value) + "/" + vcc + "/";
    DynamicJsonBuffer jsonBuffer;

    JsonObject& root = jsonBuffer.createObject();
    root["id"] = id;
    root["type"] = sensorType;
    root["value"] = value;
    root["vcc"] = vcc;

    // Store values
    sensorValues[sensorType] = value;

    transmit(url, root, HTTP_SENSOR_TIMEOUT);
}

void Hautomation::loop() {
    if (WiFi.status() != WL_CONNECTED) {
        connect();
    }

    // Ping
    ping();

    if (canRunHttpServer()) {
        httpServer.handleClient();
    }

    rest(poweredMode, _min(MAX_TIME_SLEEP, sleepTime));
}

void Hautomation::saveCounter(int value) {
    EEPROM.begin(512);
    EEPROM.put(0, value);
    EEPROM.put(10, 1);
    EEPROM.commit();
    EEPROM.end();
}

int Hautomation::loadCounter() {
    int value = 0;
    int hasBeenWritten = 0;

    EEPROM.begin(512);
    EEPROM.get(0, value);
    EEPROM.get(10, hasBeenWritten);
    EEPROM.commit();
    EEPROM.end();

    if (hasBeenWritten != 1) {
        value = 0;
    }

    return value;
}

boolean Hautomation::canRunHttpServer() {
    if (poweredMode == 1 || poweredMode == 2) {
        return true;
    } else {
        return false;
    }
}

// Mode : 0 - Deep sleep mode, 1 - always powered but sleep, 2 - always powered, 3 - light sleep mode
// Duration in seconds
void Hautomation::rest(int mode, long duration) {
    if (mode == 0) {
        Serial.println("Entering deep sleep for time " + String(sleepTime) + "s");
        ESP.deepSleep(duration * 1000000L);
    }

    if (mode == 1) {
        Serial.println("Delay for time " + String(sleepTime) + "s");
        delay(sleepTime * 1000L);
    }

    if (mode == 3) {
        Serial.println("Enetring light sleep for time " + String(sleepTime) + "s");
        wifi_set_sleep_type(LIGHT_SLEEP_T);
        delay(sleepTime * 1000L);
    }
}
