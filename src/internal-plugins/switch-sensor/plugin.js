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
            // Credits : Pixel perfect / https://www.flaticon.com/free-icon/off_3524717
            const svg = "<svg id=\"Layer_1\" enable-background=\"new 0 0 24 24\" height=\"512\" viewBox=\"0 0 24 24\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><g><path d=\"m21.5 24h-19c-1.379 0-2.5-1.121-2.5-2.5v-19c0-1.379 1.121-2.5 2.5-2.5h19c1.379 0 2.5 1.121 2.5 2.5v19c0 1.379-1.121 2.5-2.5 2.5zm-19-23c-.827 0-1.5.673-1.5 1.5v19c0 .827.673 1.5 1.5 1.5h19c.827 0 1.5-.673 1.5-1.5v-19c0-.827-.673-1.5-1.5-1.5z\"/></g><g><path d=\"m14.5 19h-5c-.827 0-1.5-.673-1.5-1.5v-11c0-.827.673-1.5 1.5-1.5h5c.827 0 1.5.673 1.5 1.5v11c0 .827-.673 1.5-1.5 1.5zm-5-13c-.275 0-.5.225-.5.5v11c0 .275.225.5.5.5h5c.275 0 .5-.225.5-.5v-11c0-.275-.225-.5-.5-.5z\"/></g><g><path d=\"m13.5 9h-3c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h3c.276 0 .5.224.5.5s-.224.5-.5.5z\"/></g></svg>";
            super(api, id, "SWITCH", configuration, svg, 0);
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
