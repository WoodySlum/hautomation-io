#include <Smarties.h>
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
Smarties smarties = Smarties();

void transmitSensor() {
    // DHT
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

    float hDHT = DHT.humidity;
    float tDHT = DHT.temperature;
    Serial.println("DHT Temperature: " + String(tDHT));
    Serial.println("DHT Humidity: " + String(hDHT));

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
    Serial.println("Rain: " + String(rainValue));

    // Pressure sensor
    float tBMP = 0;
    float aBMP = 0;
    float pBMP = 0;
    // float sBMP = 0;
    if(!bmp.begin()) {
        Serial.println("No bmp detected");
    } else {
        tBMP = bmp.readTemperature();
        aBMP = bmp.readAltitude();
        pBMP = bmp.readPressure();
        // sBMP = bmp.readSealevelPressure();
        Serial.println("BMP Temperature: " + String(tBMP));
        Serial.println("BMP Altitude: " + String(aBMP));
        Serial.println("BMP pressure: " + String(pBMP));
    }

    float temperature = tBMP;
    if (tDHT <= 100 || tDHT >= -100) {
        // Aggregation
        temperature = tDHT;
    }


    smarties.postSensorValue("TEMPERATURE", temperature);
    if (hDHT >= 0) {
        smarties.postSensorValue("HUMIDITY", hDHT);
    }
    smarties.postSensorValue("RAIN-TIME", rainValue);
    smarties.postSensorValue("ALTITUDE", aBMP);
    smarties.postSensorValue("PRESSURE", pBMP);
    // smarties.postSensorValue("PRESSURE", sBMP);
}

void setup() {
  smarties.setup(JSON_CONFIG);
}

void loop() {
    transmitSensor();
    smarties.loop();
}
