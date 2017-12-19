"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * Esp pressure form sensor
     * @class
     */
    class EspPressureSensorForm extends api.exported.PressureSensorForm {

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {EspPressureSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.iotAppPowered();
    api.sensorAPI.registerForm(EspPressureSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class EspPressureSensor extends api.exported.PressureSensor {
        /**
         * ESP Pressure sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {EspPressureSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
        }
    }

    api.sensorAPI.registerClass(EspPressureSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "esp-pressure-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "ESP pressure sensor",
    dependencies:["pressure-sensor", "esp-dht22-sensor"]
};
