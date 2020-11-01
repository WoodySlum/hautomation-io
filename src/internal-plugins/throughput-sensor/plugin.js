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
    class ThroughputSensorForm extends api.exported.SensorForm {
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
         * @returns {ThroughputSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {ThroughputSensorForm}      An instance
         */
        json(data) {
            return new ThroughputSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(ThroughputSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class ThroughputSensor extends api.exported.Sensor {
        /**
         * Throughput sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {ThroughputSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            // Credit : itim2101 / https://www.flaticon.com/free-icon/speed-test_1781682
            const svg = "<svg height=\"480pt\" viewBox=\"0 0 480 480\" width=\"480pt\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m232 128h16v16h-16zm0 0\"/><path d=\"m177.074219 147.007812 13.855469-8 8 13.855469-13.855469 8zm0 0\"/><path d=\"m139.003906 190.925781 7.996094-13.847656 13.847656 8-7.996094 13.847656zm0 0\"/><path d=\"m128 232h16v16h-16zm0 0\"/><path d=\"m336 232h16v16h-16zm0 0\"/><path d=\"m319.140625 185.066406 13.847656-7.996094 7.996094 13.847657-13.847656 7.996093zm0 0\"/><path d=\"m281.074219 152.863281 7.996093-13.855469 13.859376 7.996094-8 13.859375zm0 0\"/><path d=\"m282.34375 186.34375-32.0625 32.054688c-3.203125-1.5625-6.71875-2.382813-10.28125-2.398438-13.253906 0-24 10.746094-24 24s10.746094 24 24 24 24-10.746094 24-24c-.015625-3.5625-.835938-7.078125-2.398438-10.28125l32.0625-32.0625zm-42.34375 61.65625c-4.417969 0-8-3.582031-8-8s3.582031-8 8-8 8 3.582031 8 8-3.582031 8-8 8zm0 0\"/><path d=\"m253.710938 193.992188 4.578124-15.335938c-19.371093-5.777344-40.335937-2.0625-56.539062 10.019531-16.207031 12.082031-25.753906 31.109375-25.75 51.324219h16c-.003906-15.160156 7.15625-29.429688 19.308594-38.492188 12.15625-9.058593 27.875-11.847656 42.402344-7.515624zm0 0\"/><path d=\"m440 0h-400c-22.082031.0273438-39.9726562 17.917969-40 40v304c.0273438 22.082031 17.917969 39.972656 40 40h134.9375l-6 48h-16.9375c-13.253906 0-24 10.746094-24 24s10.746094 24 24 24h176c13.253906 0 24-10.746094 24-24s-10.746094-24-24-24h-16.9375l-6-48h134.9375c22.082031-.027344 39.972656-17.917969 40-40v-304c-.027344-22.082031-17.917969-39.9726562-40-40zm-400 16h400c13.253906 0 24 10.746094 24 24v24h-448v-24c0-13.253906 10.746094-24 24-24zm89.238281 288c-31.15625-53.789062-19.164062-122.191406 28.4375-162.171875 47.601563-39.980469 117.046875-39.980469 164.648438 0 47.601562 39.980469 59.59375 108.382813 28.4375 162.171875zm110.761719-208c-49.84375-.046875-96.160156 25.710938-122.417969 68.078125-26.257812 42.363281-28.71875 95.304687-6.503906 139.921875h-95.078125v-224h448v224h-95.078125c22.214844-44.617188 19.753906-97.558594-6.503906-139.921875-26.257813-42.367187-72.574219-68.125-122.417969-68.078125zm96 360c0 4.417969-3.582031 8-8 8h-176c-4.417969 0-8-3.582031-8-8s3.582031-8 8-8h176c4.417969 0 8 3.582031 8 8zm-41.0625-24h-109.875l6-48h97.875zm145.0625-64h-400c-13.253906 0-24-10.746094-24-24v-24h448v24c0 13.253906-10.746094 24-24 24zm0 0\"/><path d=\"m416 336h16v16h-16zm0 0\"/><path d=\"m48 32h16v16h-16zm0 0\"/><path d=\"m80 32h16v16h-16zm0 0\"/><path d=\"m112 32h16v16h-16zm0 0\"/></svg>";
            super(api, id, "THROUGHPUT", configuration, svg, 0);
            this.unit = "kBs";
            this.addUnitAggregation("mB/s", 1024);
            this.addClassifier(null, 1024, 1024);
            this.addClassifier(1025, 10240, 10240);
            this.addClassifier(10241, 30720, 30720);
            this.addClassifier(30721, 81920, 81920);
            this.addClassifier(81921, 122880, 122880);
            this.addClassifier(122881, null, 204800);
        }
    }

    api.sensorAPI.registerClass(ThroughputSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "throughput-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Throughput Sensor base plugin",
    dependencies:["sensor"]
};
