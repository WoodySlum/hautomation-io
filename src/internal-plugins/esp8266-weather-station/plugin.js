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
    api.iotAPI.registerApp("app", "esp8266-weather-station", "ESP8266 Weather station", 2, api.iotAPI.constants().PLATFORMS.ESP8266, api.iotAPI.constants().BOARDS.NODEMCU, api.iotAPI.constants().FRAMEWORKS.ARDUINO, ["esp8266"], espPlugin.generateOptions(espPlugin.constants().MODE_DEEP_SLEEP, REFRESH_TIME));

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
