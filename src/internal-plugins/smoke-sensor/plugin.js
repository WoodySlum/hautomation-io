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
            // Credits : Nikita Golubev / https://www.flaticon.com/free-icon/smoke-detector_2005231
            const svg = "<svg id=\"icons\" enable-background=\"new 0 0 64 64\" height=\"512\" viewBox=\"0 0 64 64\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m32 42c7.168 0 13-5.832 13-13s-5.832-13-13-13-13 5.832-13 13 5.832 13 13 13zm0-24c6.065 0 11 4.935 11 11s-4.935 11-11 11-11-4.935-11-11 4.935-11 11-11z\"/><path d=\"m32 50c11.579 0 21-9.421 21-21s-9.421-21-21-21-21 9.421-21 21 9.421 21 21 21zm0-40c10.477 0 19 8.523 19 19s-8.523 19-19 19-19-8.523-19-19 8.523-19 19-19z\"/><path d=\"m32 46c.553 0 1-.447 1-1s-.447-1-1-1c-8.271 0-15-6.729-15-15 0-.553-.447-1-1-1s-1 .447-1 1c0 9.374 7.626 17 17 17z\"/><path d=\"m32 14c8.271 0 15 6.729 15 15 0 .553.447 1 1 1s1-.447 1-1c0-9.374-7.626-17-17-17-.553 0-1 .447-1 1s.447 1 1 1z\"/><path d=\"m32 64c15.99 0 29-13.01 29-29v-6c0-15.99-13.01-29-29-29s-29 13.01-29 29v6c0 15.99 13.01 29 29 29zm0-2c-12.712 0-23.394-8.833-26.246-20.682 4.641 9.847 14.658 16.682 26.246 16.682s21.605-6.835 26.246-16.682c-2.852 11.849-13.534 20.682-26.246 20.682zm0-60c14.888 0 27 12.112 27 27s-12.112 27-27 27-27-12.112-27-27 12.112-27 27-27z\"/><path d=\"m32.03 51.998h-.01c-.552 0-.994.447-.994 1s.452 1 1.005 1c.552 0 1-.447 1-1s-.449-1-1.001-1z\"/><path d=\"m26 28h12c.553 0 1-.447 1-1s-.447-1-1-1h-12c-.553 0-1 .447-1 1s.447 1 1 1z\"/><path d=\"m26 31h12c.553 0 1-.447 1-1s-.447-1-1-1h-12c-.553 0-1 .447-1 1s.447 1 1 1z\"/><path d=\"m35 32h-6c-.553 0-1 .447-1 1s.447 1 1 1h6c.553 0 1-.447 1-1s-.447-1-1-1z\"/></svg>";
            super(api, id, "SMOKE", configuration, svg, 0);
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
