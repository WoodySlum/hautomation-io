"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();
    this.api = api;
    const espPlugin = api.getPluginInstance("esp8266");
    const wiringSchema = api.iotAPI.getWiringSchemaForLib("esp8266");
    wiringSchema.right["D0"].push("Nodemcu pin RST");
    wiringSchema.left["RST"].push("Nodemcu pin D0");
    wiringSchema.right["D3"].push("Soil moisture pin #1");
    wiringSchema.right["GND-2"].push("Soil moisture pin #2");
    wiringSchema.left["A0"].push("Soil moisture pin #4");
    api.iotAPI.registerApp("app", "esp8266-soil-hygrometer", "Nodemcu soil hygrometer for plants", 4, api.iotAPI.constants().PLATFORMS.ESP8266, api.iotAPI.constants().BOARDS.NODEMCU, api.iotAPI.constants().FRAMEWORKS.ARDUINO, ["esp8266"], espPlugin.generateOptions(espPlugin.constants().MODE_DEEP_SLEEP, 6 * 60 * 60), wiringSchema);
    api.iotAPI.addIngredientForReceipe("esp8266-soil-hygrometer", "Soil moisture", "A soil moisture sensor or soil hygrometer humidity", 1, true);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "esp8266-soil-hygrometer",
    version: "0.0.0",
    category: "iot",
    description: "ESP Soil hygrometer",
    dependencies:["esp8266"]
};
