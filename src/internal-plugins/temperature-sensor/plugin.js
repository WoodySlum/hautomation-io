"use strict";
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
         * @returns {SensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor, unit) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);

            /**
             * @Property("unit");
             * @Title("sensor.temperature.unit");
             * @Enum(["cel", "far"]);
             * @EnumNames(["Celsius", "Fahrenheit"]);
             * @Type("string");
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
            super(api, id, "TEMPERATURE", configuration, api.exported.Icons.class.list()["uniF2C8"], 1);
            this.setUnit(configuration.unit);
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
