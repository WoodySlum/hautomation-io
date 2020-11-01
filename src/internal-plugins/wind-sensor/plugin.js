"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by wind sensors
     * @class
     */
    class WindSensorForm extends api.exported.SensorForm {
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
         * @param  {string} unit The default unit
         * @returns {WindSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor, unit) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);

            /**
             * @Property("unit");
             * @Title("sensor.wind.unit");
             * @Enum(["kmh", "mph"]);
             * @EnumNames(["km/h", "mph"]);
             * @Type("string");
             * @Default("kmh");
             * @Required(true);
             */
            this.unit = unit;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {WindSensorForm}      An instance
         */
        json(data) {
            return new WindSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor, data.unit);
        }
    }

    api.sensorAPI.registerForm(WindSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class WindSensor extends api.exported.Sensor {
        /**
         * Wind sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {WindSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            // Credits : photo3idea_studio / https://www.flaticon.com/free-icon/anemometer_1113827
            const svg = "<svg height=\"512pt\" viewBox=\"-57 0 512 512.00007\" width=\"512pt\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m180.777344 407.230469h34.925781c4.820313 0 8.730469-3.910157 8.730469-8.730469v-34.925781c0-4.820313-3.910156-8.730469-8.730469-8.730469h-34.925781c-4.820313 0-8.730469 3.910156-8.730469 8.730469v34.925781c0 4.820312 3.910156 8.730469 8.730469 8.730469zm8.730468-34.925781h17.460938v17.464843h-17.460938zm0 0\"/><path d=\"m78.96875 170.972656c-14.074219-19.535156-41.320312-23.960937-60.855469-9.886718-17.214843 12.402343-23 35.402343-13.699219 54.476562l11.464844 23.570312c2.105469 4.339844 7.332032 6.144532 11.667969 4.039063 0-.003906.003906-.003906.003906-.003906l62.808594-30.558594c4.335937-2.109375 6.136719-7.335937 4.027344-11.671875l-7.097657-14.597656 102.21875-49.765625v79.449219c-18.691406 3.96875-32.644531 19.617187-34.453124 38.644531-11.027344 6.113281-17.886719 17.71875-17.929688 30.328125v183.351562c0 4.820313 3.90625 8.730469 8.730469 8.730469h.871093c4.175782 20.308594 22.046876 34.894531 42.78125 34.921875h17.460938c20.738281-.027344 38.605469-14.613281 42.78125-34.921875h.875c4.820312 0 8.730469-3.910156 8.730469-8.730469v-183.351562c-.042969-12.582032-6.878907-24.164063-17.871094-30.285156-1.773437-19.070313-15.769531-34.757813-34.511719-38.6875v-79.449219l96.683594 47.039062c-7.449219 22.851563 5.035156 47.410157 27.882812 54.863281 4.339844 1.414063 8.875 2.136719 13.441407 2.140626 16.714843-.003907 31.960937-9.535157 39.289062-24.558594l11.453125-23.574219c2.109375-4.335937.308594-9.558594-4.027344-11.671875-.003906 0-.003906 0-.003906 0l-62.8125-30.558594c-4.335937-2.109375-9.558594-.304687-11.671875 4.03125v.003906l-6.488281 13.332032-92.546875-45.035156 101.601563-49.339844c5.210937 7.234375 12.53125 12.679687 20.953124 15.59375 4.597657 1.59375 9.429688 2.410156 14.292969 2.417968 24.140625-.050781 43.664063-19.664062 43.609375-43.800781-.011718-6.578125-1.511718-13.066406-4.382812-18.980469l-11.460938-23.574218c-2.117187-4.332032-7.339844-6.128906-11.675781-4.015625l-62.808594 30.558593c-4.335937 2.105469-6.144531 7.332032-4.035156 11.667969.007813.011719.011719.027344.019531.039063l7.175782 14.753906-104.488282 50.789062v-15.777343c0-4.820313-3.910156-8.730469-8.734375-8.730469-4.820312 0-8.730469 3.910156-8.730469 8.730469v15.785156l-94.109374-45.808594c7.03125-23.019531-5.929688-47.375-28.945313-54.40625-20.523437-6.265625-42.554687 3.339844-51.929687 22.640625l-11.453126 23.574219c-2.113281 4.335937-.3125 9.5625 4.023438 11.671875l62.808594 30.558594c4.335937 2.113281 9.558594.316406 11.675781-4.015625l6.800781-13.96875 89.929688 43.757812-99.261719 48.28125zm-51.21875 52.65625-7.636719-15.714844c-6.527343-12.910156-1.355469-28.667968 11.554688-35.195312 12.910156-6.527344 28.664062-1.351562 35.191406 11.554688.125.242187.242187.484374.355469.730468l7.640625 15.714844zm293.742188-38.074218 7.640624-15.71875 47.148438 22.910156-7.640625 15.714844c-6.328125 13.019531-22.007813 18.445312-35.027344 12.121093-13.019531-6.328125-18.445312-22.011719-12.121093-35.027343zm49.417968-165.101563 7.640625 15.714844c6.328125 13.019531.902344 28.703125-12.117187 35.03125-13.015625 6.328125-28.703125.90625-35.03125-12.113281l-7.640625-15.714844zm-163.941406 474.085937h-17.460938c-11.097656-.015624-20.984374-7.003906-24.699218-17.460937h66.863281c-3.714844 10.457031-13.605469 17.445313-24.703125 17.460937zm34.925781-34.925781h-87.308593v-139.691406h87.308593zm0-174.011719v16.859376h-87.308593v-16.859376c0-9.644531 7.816406-17.464843 17.460937-17.464843h52.386719c9.640625 0 17.460937 7.820312 17.460937 17.464843zm-43.65625-52.988281c11.085938.019531 20.953125 7.011719 24.648438 17.460938h-49.292969c3.691406-10.449219 13.5625-17.441407 24.644531-17.460938zm-120.902343-170.933593-7.640626 15.714843-47.105468-22.890625 7.640625-15.71875c6.328125-13.015625 22.007812-18.441406 35.027343-12.117187 13.019532 6.328125 18.445313 22.007812 12.121094 35.027343zm0 0\"/></svg>";
            super(api, id, "WIND", configuration, svg, 0);
            this.setUnit(configuration.unit);
            this.addClassifier(null, 30, 30);
            this.addClassifier(31, 60, 60);
            this.addClassifier(61, 90, 90);
            this.addClassifier(91, 120, 120);
            this.addClassifier(121, 150, 150);
            this.addClassifier(151, 180, 180);
            this.addClassifier(181, 200, 200);
            this.addClassifier(201, null, 220);
        }

        /**
         * Set the unit depending on configuration
         *
         * @param {string} unit A unit configuration (`deg` or `far`)
         */
        setUnit(unit) {
            this.unit = "km/h";
            if (unit === "mph") {
                this.unit = "mph";
                this.unitConverter = (value) => {
                    return value * 0.621371;
                };
            }
        }
    }

    api.sensorAPI.registerClass(WindSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "wind-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Wind Sensor base plugin",
    dependencies:["sensor"]
};
