"use strict";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * Bmw fairuse form sensor
     * @class
     */
    class BmwDistanceSensorForm extends api.exported.DistanceSensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {BmwDistanceSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(BmwDistanceSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class BmwDistanceSensor extends api.exported.DistanceSensor {
        /**
         * Bmw fairuse sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {BmwDistanceSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            const self = this;
            api.getPluginInstance("bmw").register((data) => {
                if (data && data.mileage) {
                    self.setValue(parseFloat(data.mileage));
                }
            }, id);
        }
    }

    api.sensorAPI.registerClass(BmwDistanceSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "bmw-distance-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Bmw distance sensor",
    defaultDisabled: true,
    dependencies:["distance-sensor", "bmw"]
};
