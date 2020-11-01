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
    class ElectricSensorForm extends api.exported.SensorForm {
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
         * @returns {ElectricSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {ElectricSensorForm}      An instance
         */
        json(data) {
            return new ElectricSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(ElectricSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class ElectricSensor extends api.exported.Sensor {
        /**
         * Electric sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {HumiditySensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            // Credits : Vitaly Gorbachev / https://www.flaticon.com/free-icon/plug_2922433
            const svg = "<svg id=\"Layer_1\" enable-background=\"new 0 0 480.032 480.032\" height=\"512\" viewBox=\"0 0 480.032 480.032\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m240.032 375.284c-57.897 0-105-47.103-105-105v-89h-7c-4.418 0-8-3.582-8-8s3.582-8 8-8h42v-83c0-4.418 3.582-8 8-8s8 3.582 8 8v83h108v-83c0-4.418 3.582-8 8-8s8 3.582 8 8v83h42c4.418 0 8 3.582 8 8s-3.582 8-8 8h-201v89c0 49.075 39.925 89 89 89s89-39.925 89-89v-62c0-4.418 3.582-8 8-8s8 3.582 8 8v62c0 57.897-47.102 105-105 105zm-.005-52.998c2.935 0 5.76-1.621 7.161-4.424l24-48c2.659-5.318-1.22-11.578-7.155-11.578h-35.056l18.211-36.422c1.976-3.952.374-8.758-3.577-10.733-3.953-1.976-8.757-.374-10.733 3.577l-24 48c-2.659 5.318 1.22 11.578 7.155 11.578h35.056l-18.211 36.422c-2.667 5.333 1.243 11.58 7.149 11.58zm219.815-6.16c-4.131-1.569-8.75.511-10.318 4.641-28.368 74.727-94.911 129.011-173.66 141.668-14.592 2.344-27.831-8.925-27.831-23.701v-28.45h9c4.418 0 8-3.582 8-8s-3.582-8-8-8h-34c-4.418 0-8 3.582-8 8s3.582 8 8 8h9v28.45c0 24.627 22.069 43.409 46.37 39.498 84.385-13.563 155.686-71.724 186.08-151.787 1.567-4.13-.51-8.75-4.641-10.319zm8.668-33.563c-4.321-.924-8.575 1.818-9.505 6.138-.284 1.322-.581 2.642-.89 3.955-1.009 4.302 1.66 8.606 5.962 9.615 4.295 1.011 8.606-1.656 9.616-5.961.33-1.409.648-2.824.954-4.242.93-4.319-1.818-8.575-6.137-9.505zm-228.476-281.279c-62.131 0-122.974 23.729-169.713 70.537-103.184 103.337-90.59 271.71 23.161 359.537 1.455 1.124 3.176 1.668 4.883 1.668 7.58 0 10.942-9.664 4.895-14.332-55.33-42.721-87.123-107.261-87.228-177.069-.183-123.641 100.364-224.341 224.002-224.341 123.513.001 223.998 100.487 223.998 224 0 4.418 3.582 8 8 8s8-3.582 8-8c0-132.645-107.338-240-239.998-240z\"/></svg>";
            super(api, id, "ELECTRICITY", configuration, svg, 0);
            this.unit = "wH";
            this.addUnitAggregation("kwH", 1000);
            this.addClassifier(null, 1000, 1000);
            this.addClassifier(1001, 2000, 2000);
            this.addClassifier(2001, 5000, 5000);
            this.addClassifier(5001, 8000, 8000);
            this.addClassifier(8001, 11000, 11000);
            this.addClassifier(11001, 13000, 13000);
            this.addClassifier(13001, 16000, 16000);
            this.addClassifier(16001, 20000, 20000);
            this.addClassifier(20001, null, 21000);
        }
    }

    api.sensorAPI.registerClass(ElectricSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "electric-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Electricity Sensor base plugin",
    dependencies:["sensor"]
};
