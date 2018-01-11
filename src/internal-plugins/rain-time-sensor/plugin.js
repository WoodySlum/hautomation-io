"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by rain time sensors
     * @class
     */
    class RainTimeSensorForm extends api.exported.SensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {RainTimeSensorForm}      An instance
         */
        json(data) {
            return new RainTimeSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(RainTimeSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class RainTimeSensor extends api.exported.Sensor {
        /**
         * Rain time sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {RainTimeSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, "RAIN-TIME", configuration, api.exported.Icons.class.list()["rain-inv"], 0);
            this.chartType = api.exported.Sensor.constants().CHART_TYPE_BAR;
            this.aggregationMode = api.exported.Sensor.constants().AGGREGATION_MODE_SUM;
            this.unit = api.translateAPI.t("rain.time.unit.seconds");
            this.addUnitAggregation(api.translateAPI.t("rain.time.unit.minutes"), 1 * 60);
            this.addUnitAggregation(api.translateAPI.t("rain.time.unit.hours"), 1 * 60 * 60);
            this.addUnitAggregation(api.translateAPI.t("rain.time.unit.days"), 1 * 60 * 60 * 24);
            this.addUnitAggregation(api.translateAPI.t("rain.time.unit.months"), 1 * 60 * 60 * 24 * 30);
        }
    }

    api.sensorAPI.registerClass(RainTimeSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "rain-time-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Rain time sensor base plugin",
    dependencies:["sensor"]
};
