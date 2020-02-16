"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by signal db sensors
     * @class
     */
    class SignalDbSensorForm extends api.exported.SensorForm {
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
         * @returns {SignalDbSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {SignalDbSensorForm}      An instance
         */
        json(data) {
            return new SignalDbSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(SignalDbSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class SignalDbSensor extends api.exported.Sensor {
        /**
         * Throughput sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {PressureSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, "SIGNAL-DB", configuration, api.exported.Icons.class.list()["signal"], 0);
            this.unit = "dBm";
            this.addClassifier(null, -120, -120);
            this.addClassifier(-119, -100, -100);
            this.addClassifier(-99, -80, -80);
            this.addClassifier(-79, -60, -60);
            this.addClassifier(-59, -40, -40);
            this.addClassifier(-39, null, -30);
        }
    }

    api.sensorAPI.registerClass(SignalDbSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "signal-db-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Signal Db Sensor base plugin",
    dependencies:["sensor"]
};
