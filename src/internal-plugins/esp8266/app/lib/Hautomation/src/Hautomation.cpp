#include "Hautomation.h"

int MAX_TIME_CONNECTION_ATTEMPT = 30; // In seconds
int MAX_TIME_CONNECTION_RETRY = 30; // In seconds
float MAX_TIME_SLEEP = (ESP.deepSleepMax() / 1000000L);
int HTTP_SENSOR_TIMEOUT = 20 * 1000;
int HTTP_PING_TIMEOUT = 10 * 1000;

int POWER_MODE_DEEP_SLEEP = 0;
int POWER_MODE_SLEEP = 1;
int POWER_MODE_ALWAYS = 2;
int POWER_MODE_LIGHT_SLEEP = 3;

#define SENSOR_VCC_PIN  10

boolean updating = false;
ESP8266WebServer httpServer(80);
ESP8266HTTPUpdateServer httpUpdater;
DynamicJsonBuffer sensorBuffer;
JsonObject& sensorValues = sensorBuffer.createObject();
DynamicJsonBuffer configBuffer;
JsonVariant config;

int poweredMode = POWER_MODE_SLEEP;
int sleepTime = 60;


ADC_MODE(ADC_TOUT); // For analog read
// ADC_MODE(ADC_VCC); // For VCC read

Hautomation::Hautomation()
{

}

ESP8266WebServer &Hautomation::getWebServer() {
  return httpServer;
}

void Hautomation::enableVccPin(int pin) {
    Serial.println("Enable VCC pin");
    pinMode(pin, OUTPUT);
    digitalWrite(pin, HIGH);
    delay(200);
}

void Hautomation::disableVccPin(int pin) {
    Serial.println("Disable VCC pin");
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    delay(200);
    pinMode(pin, INPUT);
}

void Hautomation::setup(String jsonConfiguration)
{
    Serial.begin(115200);
    config = NULL;
    parseConfig(jsonConfiguration);
    Serial.println("Hautomation ESP8266 library");
    Serial.println("Configuration : ");
    Serial.println(jsonConfiguration);

    poweredMode = config["options"]["poweredMode"];
    sleepTime = config["options"]["timer"];

    if (!shouldFirmwareUpdate()) {
        checkRun();
    }

    connect();

    if (shouldFirmwareUpdate()) {
        Serial.println("Entering firmware update mode");
        updateFirmware();
    }

    enableVccPin(SENSOR_VCC_PIN);
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
            const char* iotApp = config["iotApp"];
            const char* id = config["id"];
            WiFi.hostname(String(iotApp) + "-" + String(id));
        #endif

            const char* ssid = config["ESP8266Form"]["ssid"];
            const char* passphrase = config["ESP8266Form"]["passphrase"];

            Serial.println("SSID : " + String(ssid));
            Serial.println("Passphrase : " + String(passphrase));
            WiFi.begin(ssid, passphrase);
            int counter = 0;
            while ((WiFi.status() != WL_CONNECTED) && (counter < MAX_TIME_CONNECTION_ATTEMPT)) {
                delay(500);
                Serial.print(".");
                counter++;
            }
            if (counter >= MAX_TIME_CONNECTION_ATTEMPT) {
                Serial.println("Connection failed. Trying again in " + String(MAX_TIME_CONNECTION_RETRY) + " seconds");
                rest(POWER_MODE_SLEEP, MAX_TIME_CONNECTION_RETRY);
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

    // Ping
    ping();
}

int Hautomation::getResetReason() {
  rst_info* ri = system_get_rst_info();
  if (ri == NULL)
    return -1;

  return ri->reason;
}

void Hautomation::checkRun() {
    Serial.println("Reset reason => " + String(getResetReason()));
    // REASON_DEFAULT_RST = 0, // normal startup by power on
    // REASON_WDT_RST = 1, // hardware watch dog reset
    // REASON_EXCEPTION_RST = 2, // exception reset, GPIO status won’t change
    // REASON_SOFT_WDT_RST = 3, // software watch dog reset, GPIO status won’t change
    // REASON_SOFT_RESTART = 4, // software restart ,system_restart , GPIO status won’t change
    // REASON_DEEP_SLEEP_AWAKE = 5, // wake up from deep-sleep
    if (getResetReason() != 5) {
        cleanCounter(); // Clear counter when unblug / replug esp
    }

    //sleepTime
    if (sleepTime > MAX_TIME_SLEEP) {
        int tick = loadCounter();
        int firstRun = 0;
        if (tick < 0) {
            firstRun = 1;
            tick = 1;
        }
        long elapsedTime = tick * MAX_TIME_SLEEP;
        Serial.println("Tick " + String(tick));
        if (elapsedTime >= sleepTime || firstRun == 1) {
            Serial.println("Reset counter");
            tick = 1;
            saveCounter(1);
        } else {
            long newSleepTime = sleepTime;
            if ((sleepTime - elapsedTime) <= MAX_TIME_SLEEP) {
                newSleepTime = (sleepTime - elapsedTime);
            } else {
                newSleepTime = MAX_TIME_SLEEP;
            }
            tick++;
            saveCounter(tick);
            Serial.println("Remaining sleep time " + String(newSleepTime));
            rest(poweredMode, newSleepTime);
        }
    }
}

String Hautomation::baseUrl() {
    const char* apiUrl = config["apiUrl"];

    return apiUrl;
}

void Hautomation::httpUpdateServer() {

    httpUpdater.setup(&httpServer);
    httpServer.begin();

    MDNS.addService("http", "tcp", 80);
    httpServer.on("/reboot", [](){
        Serial.println("Rebooting ...");
        httpServer.send(200, "text/html", "Rebooting, please wait ...");
        ESP.restart();
    });

    httpServer.on("/reset", [](){
        Serial.println("Resetting ...");
        httpServer.send(200, "application/json", "{}");
        ESP.reset();
    });

    httpServer.on("/values", [](){
        String values;
        sensorValues.printTo(values);
        httpServer.send(200, "application/json", values);
    });

    // httpServer.on("/ping", [](){
    //     this.ping();
    //     httpServer.send(200, "application/json", "{}");
    // });

    Serial.println("HTTP server ready");
}

void Hautomation::ping() {
    if (!shouldFirmwareUpdate()) {
        const char* id = config["id"];
        String ip = WiFi.localIP().toString();
        long freeHeap = ESP.getFreeHeap();
        // ADC_MODE(ADC_VCC);
        float vcc = ESP.getVcc() / 1000;
        // ADC_MODE(ADC_TOUT);
        const int currentVersion = config["version"];

        DynamicJsonBuffer pingBuffer;
        JsonObject& pingData = pingBuffer.createObject();
        pingData["ip"] = ip.c_str();
        pingData["freeHeap"] = freeHeap;
        pingData["vcc"] = vcc;
        pingData["version"] = currentVersion;

        String payload = transmit(baseUrl() + "esp/ping/" + String(id) + "/", pingData, HTTP_PING_TIMEOUT);

        if (payload != NULL) {
            DynamicJsonBuffer updateBuffer;
            JsonVariant updateData = parseJson(updateBuffer, payload);
            const int newVersion = updateData["version"];

            if (newVersion > currentVersion) {
                Serial.println("New firmware version available : " + String(newVersion));
                setFirmwareUpdate();
                ESP.reset();
            }
        }
    }
}

void Hautomation::updateFirmware() {
    const char* id = config["id"];
    Serial.println("Updating ...");
    resetFirmwareUpdate();
    updating = true;
    t_httpUpdate_return ret = ESPhttpUpdate.update(baseUrl() + "esp/firmware/upgrade/" + String(id) + "/");
    Serial.println("Firmware url :  " + baseUrl() + "esp/firmware/upgrade/" + String(id) + "/");
    switch(ret) {
        case HTTP_UPDATE_FAILED:
            Serial.printf("Firmware flash error (%d): %s",  ESPhttpUpdate.getLastError(), ESPhttpUpdate.getLastErrorString().c_str());
            updating = false;
            break;

        case HTTP_UPDATE_NO_UPDATES:
            Serial.println("Firmware no update");
            updating = false;
            break;

        case HTTP_UPDATE_OK:
            Serial.println("Firmware updated ! Rebooting ...");
            delay(5000);
            ESP.reset();
            break;
     }
}

String Hautomation::transmit(String url, JsonObject& jsonObject, int timeout) {
    String data;
    String payload;
    jsonObject.printTo(data);

    Serial.println("Calling " + url + " with data " + data);
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.setTimeout(timeout);
        http.begin(url);
        http.addHeader("Content-Type", "application/json");
        int httpCode = http.POST(data);

        if (httpCode == HTTP_CODE_OK || httpCode == 500) {
            payload = http.getString();
        }

        Serial.println("Response payload : " + payload);
        http.end();
    } else {
        Serial.println("Could not transmit data. Not connected to network.");
    }

    return payload;
}

void Hautomation::postSensorValue(String sensorType, float value) {
    if (!shouldFirmwareUpdate()) {
        String id = config["id"];
        // ADC_MODE(ADC_VCC);
        String vcc = String(ESP.getVcc() / 1000);
        // ADC_MODE(ADC_TOUT);
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
}

void Hautomation::loop() {
    Serial.println("+> Connecting");
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("+> Connect");
        connect();
    }


    // Ping only when not always powered
    if (poweredMode == POWER_MODE_SLEEP) {
        Serial.println("+> Ping");
        ping();
    }

    if (canRunHttpServer()) {
        Serial.println("+> Handle client");
        httpServer.handleClient();
    }

    Serial.println("+> Connecting");
    rest(poweredMode, _min(MAX_TIME_SLEEP, sleepTime));
}

void Hautomation::saveCounter(int value) {
    EEPROM.begin(512);
    EEPROM.put(0, value);
    EEPROM.put(10, 1);
    EEPROM.commit();
    EEPROM.end();
}

void Hautomation::cleanCounter() {
    EEPROM.begin(512);
    EEPROM.put(0, 1);
    EEPROM.put(10, 0);
    EEPROM.commit();
    EEPROM.end();
}

int Hautomation::loadCounter() {
    int value = 1;
    int hasBeenWritten = 0;

    EEPROM.begin(512);
    EEPROM.get(0, value);
    EEPROM.get(10, hasBeenWritten);
    EEPROM.commit();
    EEPROM.end();

    if (hasBeenWritten != 1) {
        value = -1;
    }

    return value;
}

void Hautomation::resetFirmwareUpdate() {
    Serial.println("Resetting firwmare indicator");
    EEPROM.begin(512);
    EEPROM.put(20, 100);
    EEPROM.commit();
    EEPROM.end();
}

void Hautomation::setFirmwareUpdate() {
    EEPROM.begin(512);
    EEPROM.put(20, 102);
    EEPROM.commit();
    EEPROM.end();
}

boolean Hautomation::shouldFirmwareUpdate() {
    int value = 0;

    EEPROM.begin(512);
    EEPROM.get(20, value);
    EEPROM.commit();
    EEPROM.end();

    if (value == 102) {
        return true;
    }

    return false;
}

boolean Hautomation::canRunHttpServer() {
    if ((poweredMode == POWER_MODE_SLEEP || poweredMode == POWER_MODE_ALWAYS) && !shouldFirmwareUpdate()) {
        return true;
    } else {
        return false;
    }
}

// Mode : 0 - Deep sleep mode, 1 - always powered but sleep, 2 - always powered, 3 - light sleep mode
// Duration in seconds
void Hautomation::rest(int mode, long duration) {
    if (!updating) {
        disableVccPin(SENSOR_VCC_PIN);

        if (mode == POWER_MODE_DEEP_SLEEP) {
            Serial.println("Entering deep sleep for time " + String(duration) + "s");
            ESP.deepSleep(((uint64_t)duration * 1000000L));
        }

        if (mode == POWER_MODE_SLEEP) {
            Serial.println("Delay for time " + String(duration) + "s");
            delay(sleepTime * 1000L);
        }

        if (mode == POWER_MODE_LIGHT_SLEEP) {
            Serial.println("Entering light sleep for time " + String(duration) + "s");
            wifi_set_sleep_type(LIGHT_SLEEP_T);
            delay(sleepTime * 1000L);
        }

        enableVccPin(SENSOR_VCC_PIN);
    }
}
