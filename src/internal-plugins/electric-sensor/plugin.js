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
            super(api, id, "ELECTRICITY", configuration, api.exported.Icons.class.list()["bolt"], 0);
            this.unit = "wH";
            this.addUnitAggregation("kwH", 1000);
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
