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
    class EspPlantSensorForm extends api.exported.HumiditySensorForm {

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {EspPlantSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.iotAppPowered();
    api.sensorAPI.registerForm(EspPlantSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class EspPlantSensor extends api.exported.HumiditySensor {
        /**
         * ESP Humidity sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {EspPlantSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            this.icon = api.exported.Icons.class.list()["envira"];
            this.dashboardGranularity = 24 * 60 * 60
            this.type = "SOIL-MOISTURE"; // Fork from humidity
        }

        /**
         * Set a value and store in database
         *
         * @param {number} value      A value
         * @param {number} [vcc=null] A voltage level
         * @param  {Function} [cb=null] A callback with an error parameter, called when done. Used for testing only.
         * @param {number} [timestamp=null] A timestamp
         */
        setValue(value, vcc = null, cb = null, timestamp = null) {
            super.setValue(Math.round(value), vcc, cb, timestamp);
        }
    }

    api.sensorAPI.registerClass(EspPlantSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "esp-plant-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "ESP soil hygrometer plant sensor",
    dependencies:["humidity-sensor", "esp8266-soil-hygrometer"]
};
