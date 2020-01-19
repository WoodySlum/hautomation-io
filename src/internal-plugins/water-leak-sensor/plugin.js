"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by waterLeak sensors
     * @class
     */
    class WaterLeakSensorForm extends api.exported.SensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {WaterLeakSensorForm}      An instance
         */
        json(data) {
            return new WaterLeakSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(WaterLeakSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class WaterLeakSensor extends api.exported.Sensor {
        /**
         * Presence sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {WaterLeakSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, "WATER-LEAK", configuration, api.exported.Icons.class.list()["waves"], 0);
            this.chartType = api.exported.Sensor.constants().CHART_TYPE_BAR;
            this.aggregationMode = api.exported.Sensor.constants().AGGREGATION_MODE_MAX;
            this.unit = api.translateAPI.t("waterLeak.unit.tick");
        }
    }

    api.sensorAPI.registerClass(WaterLeakSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "water-leak-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Water leak sensor base plugin",
    dependencies:["sensor"]
};
