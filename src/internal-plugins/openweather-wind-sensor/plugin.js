"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * OpenWeather wind form sensor
     * @class
     */
    class OpenweatherWindSensorForm extends api.exported.WindSensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {OpenweatherWindSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(OpenweatherWindSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class OpenweatherWindSensor extends api.exported.WindSensor {
        /**
         * Open Weather Wind sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {OpenweatherWindSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            this.openWeather = api.getPluginInstance("openweather");
            const self = this;
            this.openWeather.register((error, openWeatherDbObject) => {
                if (!error && openWeatherDbObject) {
                    self.setValue(openWeatherDbObject.windSpeed, null);
                }
            }, "wind-sensor");
        }
    }

    api.sensorAPI.registerClass(OpenweatherWindSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "openweather-wind-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Openweather wind sensor",
    dependencies:["wind-sensor", "openweather"]
};
