"use strict";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * Plant form sensor
     * @class
     */
    class PlantSensorForm extends api.exported.HumiditySensorForm {

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {PlantSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(PlantSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class PlantSensor extends api.exported.HumiditySensor {
        /**
         * Plant sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {EspPlantSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            this.icon = api.exported.Icons.class.list()["envira"];
            this.type = "PLANT-SENSOR";
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

    api.sensorAPI.registerClass(PlantSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "plant-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Soil hygrometer plant sensor",
    dependencies:["humidity-sensor"]
};
