#include <Hautomation.h>

#define SOIL_MOISTURE_SENSOR_PIN  A0
#define SOIL_MOISTURE_VCC_PIN  4

String JSON_CONFIG = "%config%";
Hautomation hautomation = Hautomation();

void transmitSensor() {
    hautomation.enableVccPin(SOIL_MOISTURE_VCC_PIN);
    float soilMoistureValue = 0;

    for (int i = 0; i < 100; i++) {
        soilMoistureValue = soilMoistureValue + analogRead(SOIL_MOISTURE_SENSOR_PIN);
    }
    soilMoistureValue = ((1000 - (soilMoistureValue / 100.0)) / 10.0); // In percent
    if (soilMoistureValue < 0) {
        soilMoistureValue = 0.0;
    }
    hautomation.postSensorValue("HUMIDITY", soilMoistureValue);
    hautomation.disableVccPin(SOIL_MOISTURE_VCC_PIN);
}

void setup() {
  hautomation.setup(JSON_CONFIG);
}

void loop() {
    transmitSensor();
    hautomation.loop();
}
