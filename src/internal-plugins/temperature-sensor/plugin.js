"use strict";

const MIN_VALUE = -50;
const MAX_VALUE = 50;

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by temperature sensors
     * @class
     */
    class TemperatureSensorForm extends api.exported.SensorForm {
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
         * @returns {TemperatureSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor, unit) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);

            /**
             * @Property("unit");
             * @Title("sensor.temperature.unit");
             * @Enum(["cel", "far"]);
             * @EnumNames(["Celsius", "Fahrenheit"]);
             * @Type("string");
             * @Default("cel");
             * @Required(true);
             */
            this.unit = unit;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {TemperatureSensorForm}      An instance
         */
        json(data) {
            return new TemperatureSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor, data.unit);
        }
    }

    api.sensorAPI.registerForm(TemperatureSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class TemperatureSensor extends api.exported.Sensor {
        /**
         * Temperature sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {TemperatureSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            // Credits : Dreamstale / https://www.flaticon.com/premium-icon/thermometer_691524
            const svg = "<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"     viewBox=\"0 0 512 512\" style=\"enable-background:new 0 0 512 512;\" xml:space=\"preserve\"><g>    <g>        <g>            <path d=\"M307.2,339.546V51.2C307.2,22.967,284.233,0,256,0c-28.233,0-51.2,22.967-51.2,51.2v288.346                c-26.442,17.263-42.667,46.929-42.667,78.587C162.133,469.892,204.242,512,256,512c51.758,0,93.867-42.108,93.867-93.867                C349.867,386.475,333.642,356.808,307.2,339.546z M256,494.933c-42.35,0-76.8-34.454-76.8-76.8                c0-27.258,14.717-52.717,38.408-66.442c2.633-1.525,4.258-4.338,4.258-7.383V51.2c0-18.821,15.308-34.133,34.133-34.133                c18.825,0,34.133,15.313,34.133,34.133v293.108c0,3.046,1.625,5.858,4.258,7.383c23.692,13.725,38.408,39.183,38.408,66.442                C332.8,460.479,298.35,494.933,256,494.933z\"/>            <path d=\"M264.533,376.329V110.933c0-4.713-3.817-8.533-8.533-8.533c-4.717,0-8.533,3.821-8.533,8.533v265.396                c-19.45,3.965-34.133,21.201-34.133,41.804c0,23.525,19.142,42.667,42.667,42.667s42.667-19.142,42.667-42.667                C298.667,397.53,283.983,380.294,264.533,376.329z M256,443.733c-14.117,0-25.6-11.483-25.6-25.6s11.483-25.6,25.6-25.6                s25.6,11.483,25.6,25.6S270.117,443.733,256,443.733z\"/>        </g>    </g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>";
            super(api, id, "TEMPERATURE", configuration, svg, 0);
            this.setUnit(configuration.unit);
            this.addClassifier(null, -30, -30);
            this.addClassifier(-29, -20, -20);
            this.addClassifier(-19, -10, -10);
            this.addClassifier(-9, -5, -5);
            this.addClassifier(-4, 0, -4);
            this.addClassifier(1, 5, 5);
            this.addClassifier(6, 10, 10);
            this.addClassifier(11, 12, 12);
            this.addClassifier(13, 15, 15);
            this.addClassifier(16, 18, 18);
            this.addClassifier(19, 20, 20);
            this.addClassifier(21, 23, 23);
            this.addClassifier(24, 26, 26);
            this.addClassifier(27, 29, 29);
            this.addClassifier(30, 32, 32);
            this.addClassifier(33, 35, 35);
            this.addClassifier(36, 38, 38);
            this.addClassifier(39, 42, 42);
            this.addClassifier(43, 50, 50);
            this.addClassifier(50, null, 60);
        }

        /**
         * Set the unit depending on configuration
         *
         * @param {string} unit A unit configuration (`deg` or `far`)
         */
        setUnit(unit) {
            this.unit = "°C";
            if (unit === "far") {
                this.unit = "°F";
                this.unitConverter = (value) => {
                    return value * (9/5) + 32;
                };
            }
        }

        /**
         * Set a value and store in database
         *
         * @param {number} value      A value
         * @param {number} [vcc=null] A voltage level
         * @param  {Function} [cb=null] A callback with an error parameter, called when done. Used for testing only.
         * @param {number} [timestamp=null] A timestamp
         */
        setValue(value, vcc = null, cb = null, timestamp = null) {
            if (value > MIN_VALUE && value < MAX_VALUE) {
                super.setValue(value, vcc, cb, timestamp);
            } else {
                api.exported.Logger.err("Invalid value for temperature : ", value);
            }

            if (value > 10) {
                this.setTileBackground("./res/tiles/hot.jpg");
            } else {
                this.setTileBackground("./res/tiles/cold.jpg");
            }
        }
    }

    api.sensorAPI.registerClass(TemperatureSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "temperature-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Temperature Sensor base plugin",
    dependencies:["sensor"]
};
