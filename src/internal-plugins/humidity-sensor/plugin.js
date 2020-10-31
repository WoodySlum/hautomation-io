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
            // Credits : Dreamstale / https://www.flaticon.com/premium-icon/humidity_691507
            const svg = "<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"	 viewBox=\"0 0 512 512\" style=\"enable-background:new 0 0 512 512;\" xml:space=\"preserve\"><g>	<g>		<g>			<path d=\"M400.493,251.658c-27.608-43.571-53.225-90.829-76.133-140.458l-44.242-95.8C275.735,5.9,266.493,0,256.001,0				c-10.492,0-19.733,5.9-24.117,15.396l-35.592,77.071c-22.525,48.788-50.1,105.675-83.825,157.696				c-20.633,31.817-29.783,68.821-26.475,107.008c6.925,80.112,70.133,144.763,150.283,153.721				c6.558,0.733,13.192,1.108,19.725,1.108c0.008,0,0.008,0,0.017,0c45.567,0,88.417-17.671,120.65-49.75				c32.242-32.092,50-74.758,50-120.146C426.668,309.958,417.618,278.679,400.493,251.658z M364.626,450.154				c-29.017,28.875-67.583,44.779-108.608,44.779c-0.008,0-0.008,0-0.017,0c-5.9,0-11.9-0.337-17.825-1				c-72.1-8.058-128.95-66.196-135.183-138.233c-2.975-34.371,5.25-67.654,23.792-96.254				c34.317-52.921,62.225-110.487,85.008-159.821l35.592-77.075c2.35-5.087,7.192-5.483,8.617-5.483				c1.425,0,6.267,0.396,8.617,5.488l44.242,95.8c23.233,50.313,49.208,98.233,77.217,142.437				c15.392,24.288,23.525,52.404,23.525,81.313C409.601,382.917,393.626,421.288,364.626,450.154z\"/>			<path d=\"M320.976,257.796c-3.725-2.892-9.075-2.208-11.975,1.5l-119.467,153.6c-2.9,3.717-2.225,9.079,1.492,11.975				c1.558,1.208,3.408,1.796,5.233,1.796c2.542,0,5.058-1.133,6.742-3.296l119.467-153.6				C325.368,266.054,324.693,260.692,320.976,257.796z\"/>			<path d=\"M298.668,349.867c-18.825,0-34.133,15.312-34.133,34.133s15.308,34.133,34.133,34.133s34.133-15.313,34.133-34.133				S317.493,349.867,298.668,349.867z M298.668,401.067c-9.408,0-17.067-7.654-17.067-17.067s7.658-17.067,17.067-17.067				s17.067,7.654,17.067,17.067S308.076,401.067,298.668,401.067z\"/>			<path d=\"M213.335,332.8c18.825,0,34.133-15.312,34.133-34.133s-15.308-34.133-34.133-34.133				c-18.825,0-34.133,15.313-34.133,34.133S194.51,332.8,213.335,332.8z M213.335,281.6c9.408,0,17.067,7.654,17.067,17.067				s-7.658,17.067-17.067,17.067c-9.408,0-17.067-7.654-17.067-17.067S203.926,281.6,213.335,281.6z\"/>		</g>	</g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>";
            super(api, id, "HUMIDITY", configuration, svg, 1);
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
