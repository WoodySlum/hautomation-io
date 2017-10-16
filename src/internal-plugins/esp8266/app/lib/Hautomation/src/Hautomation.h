#ifndef Hautomation_h
#define Hautomation_h

#if ARDUINO >= 100
  #include "Arduino.h"
#else

#endif

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <ESP8266HTTPUpdateServer.h>
#include <ArduinoJson.h>

// Your class header here...
class Hautomation {
  public:
    Hautomation();
    JsonObject &parseJson(String json);
    void setup(String jsonConfiguration);
    void loop();
    String baseUrl();
    void transmit(String url, JsonObject &object);
    void postSensorValue(String id, float value, float vcc);
  private:
    JsonObject *_config;

    void httpUpdateServer();
    void connect();
    void parseConfig(String jsonConfiguration);
};

#endif
