"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by throughput sensors
     * @class
     */
    class PresenceSensorForm extends api.exported.SensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {PresenceSensorForm}      An instance
         */
        json(data) {
            return new PresenceSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(PresenceSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class PresenceSensor extends api.exported.Sensor {
        /**
         * Presence sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {PresenceSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, "PRESENCE", configuration, api.exported.Icons.class.list()["male"], 0);
            this.chartType = api.exported.Sensor.constants().CHART_TYPE_BAR;
            this.aggregationMode = api.exported.Sensor.constants().AGGREGATION_MODE_SUM;
            this.unit = api.translateAPI.t("presence.unit.seconds");
            this.addUnitAggregation(api.translateAPI.t("presence.unit.minutes"), 1 * 60);
            this.addUnitAggregation(api.translateAPI.t("presence.unit.hours"), 1 * 60 * 60);
            this.addUnitAggregation(api.translateAPI.t("presence.unit.days"), 1 * 60 * 60 * 24);
            this.addUnitAggregation(api.translateAPI.t("presence.unit.months"), 1 * 60 * 60 * 24 * 30);
        }
    }

    api.sensorAPI.registerClass(PresenceSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "presence-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Presence Sensor base plugin",
    dependencies:["sensor"]
};
