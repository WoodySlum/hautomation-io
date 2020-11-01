"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by switch sensors
     * @class
     */
    class SwitchSensorForm extends api.exported.SensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {SwitchSensorForm}      An instance
         */
        json(data) {
            return new SwitchSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(SwitchSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class SwitchSensor extends api.exported.Sensor {
        /**
         * Switch sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {SwitchSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, "SWITCH", configuration, api.exported.Icons.icons["switch"], 0);
            this.chartType = api.exported.Sensor.constants().CHART_TYPE_BAR;
            this.aggregationMode = api.exported.Sensor.constants().AGGREGATION_MODE_LAST;
            this.unit = api.translateAPI.t("switch.unit.state");
            this.addClassifier(null, 0.99, 0);
            this.addClassifier(1, null, 1);
        }
    }

    api.sensorAPI.registerClass(SwitchSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "switch-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Switch sensor base plugin",
    dependencies:["sensor"]
};
