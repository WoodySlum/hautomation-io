"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by humidity sensors
     * @class
     */
    class ElectricSensorForm extends api.exported.SensorForm {
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
         * @returns {ElectricSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {ElectricSensorForm}      An instance
         */
        json(data) {
            return new ElectricSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(ElectricSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class ElectricSensor extends api.exported.Sensor {
        /**
         * Electric sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {HumiditySensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, "ELECTRICITY", configuration, api.exported.Icons.icons["electricity"], 0);
            this.unit = "wH";
            this.addUnitAggregation("kwH", 1000);
            this.addClassifier(null, 1000, 1000);
            this.addClassifier(1001, 2000, 2000);
            this.addClassifier(2001, 5000, 5000);
            this.addClassifier(5001, 8000, 8000);
            this.addClassifier(8001, 11000, 11000);
            this.addClassifier(11001, 13000, 13000);
            this.addClassifier(13001, 16000, 16000);
            this.addClassifier(16001, 20000, 20000);
            this.addClassifier(20001, null, 21000);
        }
    }

    api.sensorAPI.registerClass(ElectricSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "electric-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Electricity Sensor base plugin",
    dependencies:["sensor"]
};
