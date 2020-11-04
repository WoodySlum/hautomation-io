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
            super(api, id, "TEMPERATURE", configuration, api.exported.Icons.icons["temperature"], 0);
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

            if (value > 28) {
                this.setTileBackground("./res/tiles/hot.jpg");
            } else if (value > 12) {
                this.setTileBackground("./res/tiles/nice-day.jpg");
            } else if (value > 4) {
                this.setTileBackground("./res/tiles/cold-day.jpg");
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
