#include <Hautomation.h>

#define SOIL_MOISTURE_SENSOR_PIN  A0

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

    hautomation.postSensorValue("HUMIDITY", soilMoistureValue);
}

void setup() {
  hautomation.setup(JSON_CONFIG);
}

void loop() {
    transmitSensor();
    hautomation.loop();
}
