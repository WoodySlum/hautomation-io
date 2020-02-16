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
    class HumiditySensorForm extends api.exported.SensorForm {
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
         * @returns {HumiditySensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {HumiditySensorForm}      An instance
         */
        json(data) {
            return new HumiditySensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(HumiditySensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class HumiditySensor extends api.exported.Sensor {
        /**
         * Humidity sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {HumiditySensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, "HUMIDITY", configuration, api.exported.Icons.class.list()["tint"], 1);
            this.unit = "%";
            this.addClassifier(null, 10, 10);
            this.addClassifier(11, 30, 30);
            this.addClassifier(31, 50, 50);
            this.addClassifier(51, 80, 80);
            this.addClassifier(81, null, 100);
        }
    }

    api.sensorAPI.registerClass(HumiditySensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "humidity-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Humidity Sensor base plugin",
    dependencies:["sensor"]
};
