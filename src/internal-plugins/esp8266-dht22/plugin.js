"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    const espPlugin = api.getPluginInstance("esp8266");
    api.iotAPI.registerApp("app", "esp8266-dht22", "ESP8266 Temperature and humidity sensor", 1, api.iotAPI.constants().PLATFORMS.ESP8266, api.iotAPI.constants().BOARDS.NODEMCU, api.iotAPI.constants().FRAMEWORKS.ARDUINO, ["esp8266"], espPlugin.generateOptions(espPlugin.constants().MODE_SLEEP, 30));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "esp-dht22-sensor",
    version: "0.0.0",
    category: "iot",
    description: "ESP Humidity and temperature sensor",
    dependencies:["esp8266"]
};
