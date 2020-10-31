"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by pressure sensors
     * @class
     */
    class PressureSensorForm extends api.exported.SensorForm {
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
         * @returns {PressureSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {PressureSensorForm}      An instance
         */
        json(data) {
            return new PressureSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(PressureSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class PressureSensor extends api.exported.Sensor {
        /**
         * Throughput sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {PressureSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            // Credits : Vitaly Gorbachev / https://www.flaticon.com/premium-icon/barometer_3368918
            const svg = "<svg id=\"Layer_1\" enable-background=\"new 0 0 479 479\" height=\"512\" viewBox=\"0 0 479 479\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m170.5 360.844v6.156c0 19.851 16.149 36 36 36h66c13.443 0 25.673-7.405 31.916-19.327 2.051-3.914 6.883-5.424 10.799-3.375 3.914 2.05 5.425 6.885 3.375 10.799-7.916 15.116-22.503 25.2-39.09 27.433v52.47c0 4.418-3.582 8-8 8s-8-3.582-8-8v-52h-57c-28.673 0-52-23.327-52-52 0-19.478-.611-20.627 1.956-23.593 2.352-2.72 6.237-3.531 9.49-1.989 112.673 53.771 244.554-28.531 244.554-154.418 0-94.29-76.71-171-171-171s-171 76.71-171 171c0 50.221 21.958 97.709 60.242 130.287 3.365 2.863 3.771 7.912.908 11.277-2.864 3.365-7.913 3.772-11.277.908-41.863-35.622-65.873-87.552-65.873-142.472 0-103.112 83.888-187 187-187s187 83.888 187 187c0 132.29-134.123 222.388-256 173.844zm37 75.253c-4.418 0-8 3.582-8 8v26.903c0 4.418 3.582 8 8 8s8-3.582 8-8v-26.903c0-4.418-3.582-8-8-8zm-41.343-175.754c-3.124-3.123-8.189-3.123-11.313 0l-14.176 14.176c-19.465-21.922-30.919-49.295-32.874-78.519h7.706c4.418 0 8-3.582 8-8s-3.582-8-8-8h-7.822c3.484-67.121 56.906-120.669 123.822-124.696v7.696c0 4.418 3.582 8 8 8s8-3.582 8-8v-7.696c66.652 4.011 119.682 56.995 123.695 123.696h-7.695c-4.418 0-8 3.582-8 8s3.582 8 8 8h7.698c-1.721 28.599-12.674 56.741-32.867 79.517l-14.174-14.174c-3.125-3.123-8.189-3.123-11.314 0-3.124 3.125-3.124 8.189 0 11.314l20 20c3.126 3.124 8.189 3.123 11.314 0 28.804-28.804 43.35-66.938 43.35-104.657 0-81.64-66.197-148.007-148.007-148.007-80.6 0-148.415 65.259-147.998 148.813-.757 33.82 13.518 74.029 43.341 103.852 3.124 3.123 8.189 3.123 11.313 0l20-20c3.125-3.126 3.125-8.19.001-11.315zm122.209-146.497-69.556 44.14c-20.913 13.272-22.678 43.328-3.23 58.896 8.219 6.579 18.847 9.233 29.124 7.365 4.348-.789 7.231-4.953 6.442-9.3s-4.954-7.235-9.3-6.442c-12.063 2.197-23.337-6.79-23.843-19.086-.296-7.196 3.298-14.063 9.379-17.923l49.853-31.637-16.316 45.438c-1.493 4.158.667 8.74 4.825 10.233 4.155 1.491 8.739-.666 10.233-4.825l24.203-67.399c2.567-7.146-5.394-13.535-11.814-9.46zm-86.866 169.154c-4.418 0-8 3.582-8 8s3.582 8 8 8h76c4.418 0 8-3.582 8-8s-3.582-8-8-8z\"/></svg>";
            super(api, id, "PRESSURE", configuration, svg, 0);
            this.unit = "Pa";

            this.addUnitAggregation("hPa", 100);
            this.addClassifier(null, 99000, 99000);
            this.addClassifier(99001, 99600, 99600);
            this.addClassifier(99601, 99800, 99800);
            this.addClassifier(99801, 100000, 100000);
            this.addClassifier(100001, 101000, 101000);
            this.addClassifier(101001, 102000, 102000);
            this.addClassifier(102001, 103000, 103000);
            this.addClassifier(103001, null, 104000);
        }
    }

    api.sensorAPI.registerClass(PressureSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "pressure-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Pressure Sensor base plugin",
    dependencies:["sensor"]
};
