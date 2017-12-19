#include <Hautomation.h>
#include <dht.h>
#include <Wire.h>
#include <Adafruit_BMP085.h>

// DHT
dht DHT;
#define DHT_PIN 4

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
    int rainValue = analogRead(WATER_SENSOR_PIN);
    Serial.println("Rain: ");
    Serial.println(rainValue);

    // Pressure sensor
    float tBMP = bmp.readTemperature();
    float aBMP = bmp.readAltitude();
    float pBMP = bmp.readPressure();
    float sBMP = bmp.readSealevelPressure();


    // Aggregation
    float avgTemperature = (tBMP + tDHT) / 2;

    hautomation.postSensorValue("TEMPERATURE", avgTemperature);
    hautomation.postSensorValue("HUMIDITY", hDHT);
    hautomation.postSensorValue("RAIN", rainValue);
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
