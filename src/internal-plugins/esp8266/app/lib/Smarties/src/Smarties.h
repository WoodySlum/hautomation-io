#ifndef Smarties_h
#define Smarties_h

#if ARDUINO >= 100
  #include "Arduino.h"
  #include "EEPROM.h"
#else

#endif

#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266httpUpdate.h>
#include <ESP8266HTTPUpdateServer.h>
#define ARDUINOJSON_ENABLE_PROGMEM 0
#include <ArduinoJson.h>
extern "C" {
#include "user_interface.h"
}

class Smarties {
  public:
    Smarties();
    ESP8266WebServer &getWebServer();
    JsonObject &parseJson(DynamicJsonBuffer &jsonBuffer, String json);
    void setup(String jsonConfiguration);
    void loop();
    String baseUrl();
    String transmit(String url, JsonObject& jsonObject, int timeout);
    void postSensorValue(String sensorType, float value);
    JsonVariant &getConfig();
    void rest(int mode, long duration);
    void ping();
    void enableVccPin(int pin);
    void disableVccPin(int pin);
  private:
    int getResetReason();
    void checkRun();
    void httpUpdateServer();
    void connect();
    void parseConfig(String jsonConfiguration);
    void updateFirmware();
    void cleanCounter();
    void saveCounter(int value);
    int loadCounter();
    boolean canRunHttpServer();
    void resetFirmwareUpdate();
    void setFirmwareUpdate();
    boolean shouldFirmwareUpdate();
};

#endif
