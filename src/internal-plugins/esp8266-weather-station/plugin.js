"use strict";

const REFRESH_TIME = 60 * 5;

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    const espPlugin = api.getPluginInstance("esp8266");
    const wiringSchema = api.iotAPI.getWiringSchemaForLib("esp8266");
    wiringSchema.right["D0"].push("Nodemcu pin RST");
    wiringSchema.left["RST"].push("Nodemcu pin D0");
    wiringSchema.right["D2"].push("DHT22 pin #2");
    wiringSchema.left["VIN"].push("DHT22 pin #1", "BM180 VIN", "Water Sensor pin + / VIN");
    wiringSchema.left["GND-2"].push("DHT22 pin #4", "BM180 GND", "Water Sensor pin - / GND");
    wiringSchema.right["D4"].push("BM180 SDA");
    wiringSchema.right["D5"].push("BM180 SCL");
    wiringSchema.left["A0"].push("Water Sensor pin S / Data");
    api.iotAPI.registerApp("app", "esp8266-weather-station", "Nodemcu Weather station", 5, api.iotAPI.constants().PLATFORMS.ESP8266, api.iotAPI.constants().BOARDS.NODEMCU, api.iotAPI.constants().FRAMEWORKS.ARDUINO, ["esp8266"], espPlugin.generateOptions(espPlugin.constants().MODE_LIGHT_SLEEP, REFRESH_TIME), wiringSchema);
    api.iotAPI.addIngredientForReceipe("esp8266-weather-station", "bmp180", "Pressure, temperature and altitude sensor", 1, true);
    api.iotAPI.addIngredientForReceipe("esp8266-weather-station", "dht22", "Pressure, temperature sensor", 1, true);
    api.iotAPI.addIngredientForReceipe("esp8266-weather-station", "Funduino water sensor", "Rain drop module", 1, true);

    /**
     * This class manage EspWeatherStation
     * @class
     */
    class EspWeatherStation {
        /**
         * List of Constants
         *
         * @returns {Object} Returns the list of constants
         */
        static constants() {
            return {REFRESH_TIME:REFRESH_TIME};
        }
    }

    api.exportClass(EspWeatherStation);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "esp-weather-station-sensor",
    version: "0.0.0",
    category: "iot",
    description: "ESP Weather station",
    dependencies:["esp8266"]
};
