"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * Esp humidity form sensor
     * @class
     */
    class EspHumiditySensorForm extends api.exported.HumiditySensorForm {

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {EspHumiditySensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.iotAppPowered();
    api.sensorAPI.registerForm(EspHumiditySensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class EspHumiditySensor extends api.exported.HumiditySensor {
        /**
         * ESP Humidity sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {EspHumiditySensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
        }
    }

    api.sensorAPI.registerClass(EspHumiditySensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "esp-humidity-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "ESP humidity sensor",
    dependencies:["humidity-sensor", "esp-dht22-sensor"]
};
