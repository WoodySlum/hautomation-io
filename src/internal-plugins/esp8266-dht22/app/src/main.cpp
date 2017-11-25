/*
 *  This sketch demonstrates how to set up a simple HTTP-like server.
 *  The server will set a GPIO pin depending on the request
 *    http://server_ip/gpio/0 will set the GPIO2 low,
 *    http://server_ip/gpio/1 will set the GPIO2 high
 *  server_ip is the IP address of the ESP8266 module, will be
 *  printed to Serial when the module is connected.
 */

#include <Hautomation.h>
#include <dht.h>

// DHT
dht DHT;
#define DHT_PIN 5

String JSON_CONFIG = "%config%";
Hautomation hautomation = Hautomation();

void transmitSensor() {
    int chk = DHT.read22(DHT_PIN);
    switch (chk)
    {
        case DHTLIB_OK:
            Serial.println("OK,\t");
            break;
        case DHTLIB_ERROR_CHECKSUM:
            Serial.println("Checksum error,\t");
            break;
        case DHTLIB_ERROR_TIMEOUT:
            Serial.println("Time out error,\t");
            break;
        default:
            Serial.println("Unknown error,\t");
            break;
    }

    float h = DHT.humidity;
    float t = DHT.temperature;

    hautomation.postSensorValue("TEMPERATURE", t);
    hautomation.postSensorValue("HUMIDITY", h);
}

void setup() {
  hautomation.setup(JSON_CONFIG);

  JsonVariant toto = hautomation.getConfig();
  const char* ip = toto["ip"];
}

void loop() {
    transmitSensor();
    hautomation.loop();
}
