"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * Esp temperature form sensor
     * @class
     */
    class EspTemperatureSensorForm extends api.exported.TemperatureSensorForm {

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {EspTemperatureSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.iotAppPowered();
    api.sensorAPI.registerForm(EspTemperatureSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class EspTemperatureSensor extends api.exported.TemperatureSensor {
        /**
         * ESP Temperature sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {EspTemperatureSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
        }
    }

    api.sensorAPI.registerClass(EspTemperatureSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "esp-temperature-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "ESP temperature sensor",
    dependencies:["temperature-sensor", "esp-dht22-sensor"]
};
