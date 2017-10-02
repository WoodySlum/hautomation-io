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
            super(api, id, "PRESSURE", configuration, api.exported.Icons.class.list()["_481"], 0);
            this.unit = "Pa";
            this.addUnitAggregation("hPa", 100);
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
