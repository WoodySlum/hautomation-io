"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by fairuse sensors
     * @class
     */
    class PercentSensorForm extends api.exported.SensorForm {
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
         * @returns {PercentSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {PercentSensorForm}      An instance
         */
        json(data) {
            return new PercentSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(PercentSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class PercentSensor extends api.exported.Sensor {
        /**
         * Percent sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {PercentSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, "PERCENT", configuration, api.exported.Icons.class.list()["percent"], 0, null, api.exported.Sensor.constants().AGGREGATION_MODE_AVG);
            this.unit = "%";
            this.addClassifier(null, 10, 10);
            this.addClassifier(11, 30, 30);
            this.addClassifier(31, 50, 50);
            this.addClassifier(51, 80, 80);
            this.addClassifier(81, null, 100);
        }
    }

    api.sensorAPI.registerClass(PercentSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "percent-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Percent Sensor base plugin",
    dependencies:["sensor"]
};
