"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by flood sensors
     * @class
     */
    class FloodSensorForm extends api.exported.SensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {FloodSensorForm}      An instance
         */
        json(data) {
            return new FloodSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(FloodSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class FloodSensor extends api.exported.Sensor {
        /**
         * Presence sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {FloodSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, "FLOOD", configuration, api.exported.Icons.class.list()["waves"], 0);
            this.chartType = api.exported.Sensor.constants().CHART_TYPE_BAR;
            this.aggregationMode = api.exported.Sensor.constants().AGGREGATION_MODE_MAX;
            this.unit = api.translateAPI.t("flood.unit.tick");
        }
    }

    api.sensorAPI.registerClass(FloodSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "flood-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Flood Sensor base plugin",
    dependencies:["sensor"]
};
