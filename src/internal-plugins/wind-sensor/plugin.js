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
            super(api, id, "WIND", configuration, api.exported.Icons.class.list()["wind"], 0);
            this.setUnit(configuration.unit);
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
