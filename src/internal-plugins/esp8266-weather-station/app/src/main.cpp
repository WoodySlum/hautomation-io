#include <Hautomation.h>
#include <dht.h>
#include <Wire.h>
#include <Adafruit_BMP085.h>

// DHT
dht DHT;
#define DHT_PIN 12

// Rain sensor
#define WATER_SENSOR_PIN  A0

// Pressure sensor
Adafruit_BMP085 bmp;
#define PRESSURE_PIN_1 2
#define PRESSURE_PIN_2 14



String JSON_CONFIG = "%config%";
Hautomation hautomation = Hautomation();

void transmitSensor() {
    // DHT
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

    float hDHT = DHT.humidity;
    float tDHT = DHT.temperature;

    // Pressure
    Wire.begin(PRESSURE_PIN_1, PRESSURE_PIN_2);
    bmp.begin();

    // Water sensor
    pinMode(WATER_SENSOR_PIN, INPUT);
    Serial.println("Request rain sensor");
    float rainValue = 0;
    for (int i = 0; i < 100; i++) {
        rainValue = rainValue + analogRead(WATER_SENSOR_PIN);
    }
    rainValue = rainValue  / 100.0;
    Serial.println("Rain: ");
    Serial.println(rainValue);

    // Pressure sensor
    float tBMP = 0;
    float aBMP = 0;
    float pBMP = 0;
    float sBMP = 0;
    if(!bmp.begin()) {
        Serial.println("No bmp detected");
    } else {
        tBMP = bmp.readTemperature();
        aBMP = bmp.readAltitude();
        pBMP = bmp.readPressure();
        sBMP = bmp.readSealevelPressure();
    }

    // Aggregation
    float avgTemperature = (tBMP + tDHT) / 2;

    hautomation.postSensorValue("TEMPERATURE", avgTemperature);
    hautomation.postSensorValue("HUMIDITY", hDHT);
    hautomation.postSensorValue("RAIN-TIME", rainValue);
    hautomation.postSensorValue("ALTITUDE", aBMP);
    hautomation.postSensorValue("PRESSURE", pBMP);
    // hautomation.postSensorValue("PRESSURE", sBMP);
}

void setup() {
  hautomation.setup(JSON_CONFIG);
}

void loop() {
    transmitSensor();
    hautomation.loop();
}
