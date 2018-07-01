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
    class FairuseSensorForm extends api.exported.SensorForm {
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
         * @returns {FairuseSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {FairuseSensorForm}      An instance
         */
        json(data) {
            return new FairuseSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(FairuseSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class FairuseSensor extends api.exported.Sensor {
        /**
         * Fairuse sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {FairuseSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, "FAIRUSE", configuration, api.exported.Icons.class.list()["cloud_download"], 0);
            this.unit = "kB";
            this.addUnitAggregation("MB", 1024);
            this.addUnitAggregation("GB", 1048576);
            this.addUnitAggregation("TB", 1073741824);
        }
    }

    api.sensorAPI.registerClass(FairuseSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "fairuse-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Fairuse Sensor base plugin",
    dependencies:["sensor"]
};
