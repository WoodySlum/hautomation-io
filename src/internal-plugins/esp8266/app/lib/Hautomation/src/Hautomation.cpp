#include "Hautomation.h"

ESP8266WebServer httpServer(80);
ESP8266HTTPUpdateServer httpUpdater;
DynamicJsonBuffer  sensorBuffer(200);
JsonObject& sensorValues = sensorBuffer.createObject();

Hautomation::Hautomation()
{

}

void Hautomation::setup(String jsonConfiguration)
{
    Serial.begin(115200);

    delay(5000);
    parseConfig(jsonConfiguration);
    Serial.println("Hautomation ESP8266 library");
    Serial.println("Configuration : ");
    Serial.println(jsonConfiguration);

    connect();
}

JsonObject &Hautomation::parseJson(String json) {
    DynamicJsonBuffer  jsonBuffer(200);
    JsonObject &root = jsonBuffer.parseObject(json);
    if (!root.success()) {
        Serial.println("parseObject() failed");
    }

    return root;
}

void Hautomation::parseConfig(String jsonConfiguration) {
    _config = &parseJson(jsonConfiguration);
}

void Hautomation::connect() {
    if (WiFi.status() != WL_CONNECTED) {
        #ifdef ESP8266
            WiFi.hostname("DEMO_HAUTOMATION");
        #endif

            const char* ssid = (*_config)["wifi"]["ssid"];
            const char* passphrase = (*_config)["wifi"]["passphrase"];

            Serial.println("SSID : " + String(ssid));
            //Serial.println("Passphrase : " + String(passphrase));
            WiFi.begin(ssid, passphrase);
            while (WiFi.status() != WL_CONNECTED) {
                delay(500);
                Serial.print(".");
            }

            Serial.println("");
            Serial.println("WiFi connected");
    } else {
        Serial.println("Already connected");
    }

    // Print the IP address
    Serial.println(WiFi.localIP());

    // Start update server
    httpUpdateServer();
}

String Hautomation::baseUrl() {
    const char* ip = (*_config)["ip"];
    int port = (*_config)["port"];
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

void Hautomation::transmit(String url, JsonObject &object) {
    String data;
    object.printTo(data);

    HTTPClient http;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.POST(data);
    http.writeToStream(&Serial);
    http.end();
}

void Hautomation::postSensorValue(String id, float value, float vcc) {
    String url = baseUrl() + "esp/sensor/set/" + id + "/" + value + "/" + vcc + "/";
    StaticJsonBuffer<200> jsonBuffer;

    JsonObject& root = jsonBuffer.createObject();
    root["id"] = id;
    root["value"] = value;
    root["vcc"] = vcc;

    // Store values
    sensorValues[id] = root;

    transmit(url, root);
}

void Hautomation::loop() {
    if (WiFi.status() != WL_CONNECTED) {
        connect();
    }

    httpServer.handleClient();
}
