"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by smoke sensors
     * @class
     */
    class SmokeSensorForm extends api.exported.SensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {SmokeSensorForm}      An instance
         */
        json(data) {
            return new SmokeSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(SmokeSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class SmokeSensor extends api.exported.Sensor {
        /**
         * Presence sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {SmokeSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, "SMOKE", configuration, api.exported.Icons.class.list()["fire-station-1"], 0);
            this.chartType = api.exported.Sensor.constants().CHART_TYPE_BAR;
            this.aggregationMode = api.exported.Sensor.constants().AGGREGATION_MODE_MAX;
            this.unit = api.translateAPI.t("smoke.unit.tick");
            this.addClassifier(null, 0.99, 0);
            this.addClassifier(1, null, 1);
        }
    }

    api.sensorAPI.registerClass(SmokeSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "smoke-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Smoke Sensor base plugin",
    dependencies:["sensor"]
};
