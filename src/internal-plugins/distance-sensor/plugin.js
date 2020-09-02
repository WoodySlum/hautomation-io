"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by distance sensors
     * @class
     */
    class DistanceSensorForm extends api.exported.SensorForm {
        /**
         * Sensor form
         *
         * @param  {number} id              An identifier
         * @param  {string} plugin          A plugin
         * @param  {string} name            Sensor's name
         * @param  {boolean} dashboard       True if display on dashboard, otherwise false
         * @param  {boolean} statistics      True if display on statistics, otherwise false
         * @param  {string} dashboardColor  The dashboard color
         * @param  {string} statisticsColor The statistics color
         * @returns {DistanceSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {DistanceSensorForm}      An instance
         */
        json(data) {
            return new DistanceSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(DistanceSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class DistanceSensor extends api.exported.Sensor {
        /**
         * Distance sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {DistanceSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, "DISTANCE", configuration, api.exported.Icons.class.list()["road"], 0, null, api.exported.Sensor.constants().AGGREGATION_MODE_MAX);
            this.unit = "km";

            this.addClassifier(null, 1000, 1000);
            this.addClassifier(1001, 10000, 10000);
            this.addClassifier(10001, 30000, 30000);
            this.addClassifier(30001, 50000, 50000);
            this.addClassifier(50001, 100000, 100000);
            this.addClassifier(100001, 200000, 200000);
            this.addClassifier(200001, null, 300000);
        }
    }

    api.sensorAPI.registerClass(DistanceSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "distance-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Distance Sensor base plugin",
    dependencies:["sensor"]
};
