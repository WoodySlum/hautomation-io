"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by pressure sensors
     * @class
     */
    class PressureSensorForm extends api.exported.SensorForm {
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
         * @returns {PressureSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {PressureSensorForm}      An instance
         */
        json(data) {
            return new PressureSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(PressureSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class PressureSensor extends api.exported.Sensor {
        /**
         * Throughput sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {PressureSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, "PRESSURE", configuration, api.exported.Icons.icons["barometer"], 0);
            this.unit = "Pa";

            this.addUnitAggregation("hPa", 100);
            this.addClassifier(null, 99000, 99000);
            this.addClassifier(99001, 99600, 99600);
            this.addClassifier(99601, 99800, 99800);
            this.addClassifier(99801, 100000, 100000);
            this.addClassifier(100001, 101000, 101000);
            this.addClassifier(101001, 102000, 102000);
            this.addClassifier(102001, 103000, 103000);
            this.addClassifier(103001, null, 104000);
        }
    }

    api.sensorAPI.registerClass(PressureSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "pressure-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Pressure Sensor base plugin",
    dependencies:["sensor"]
};
