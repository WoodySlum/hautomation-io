#include <Hautomation.h>
#include <dht.h>

#define SOIL_MOISTURE_SENSOR_PIN  A0
// DHT
dht DHT;
#define DHT_PIN 12

String JSON_CONFIG = "%config%";
Hautomation hautomation = Hautomation();

void transmitSensor() {
    float soilMoistureValue = 0;

    for (int i = 0; i < 100; i++) {
        soilMoistureValue = soilMoistureValue + analogRead(SOIL_MOISTURE_SENSOR_PIN);
    }
    soilMoistureValue = ((1000 - (soilMoistureValue / 100.0)) / 10.0); // In percent
    if (soilMoistureValue < 0) {
        soilMoistureValue = 0.0;
    }

    hautomation.postSensorValue("SOIL-MOISTURE", soilMoistureValue);
        
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

    if (t > 0) {
        hautomation.postSensorValue("TEMPERATURE", t);
    }
    if (h > 0) {
        hautomation.postSensorValue("HUMIDITY", h);
    }
}

void setup() {
  hautomation.setup(JSON_CONFIG);
}

void loop() {
    transmitSensor();
    hautomation.loop();
}
