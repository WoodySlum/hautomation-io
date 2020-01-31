#include <Smarties.h>
#include <dht.h>

// DHT
dht DHT;
#define DHT_PIN 12

String JSON_CONFIG = "%config%";
Smarties smarties = Smarties();

void transmitSensor() {
    delay(2000);
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

    if (t <= 100 || t >= -100) {
        smarties.postSensorValue("TEMPERATURE", t);
    }
    if (h >= 0) {
        smarties.postSensorValue("HUMIDITY", h);
    }

}

void setup() {
  smarties.setup(JSON_CONFIG);
}

void loop() {
    transmitSensor();
    smarties.loop();
}
