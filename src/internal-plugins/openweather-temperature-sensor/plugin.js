"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * OpenWeather temperature form sensor
     * @class
     */
    class OpenweatherTemperatureSensorForm extends api.exported.TemperatureSensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {OpenweatherTemperatureSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(OpenweatherTemperatureSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class OpenweatherTemperatureSensor extends api.exported.TemperatureSensor {
        /**
         * Open Weather Temperature sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {OpenweatherTemperatureSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            this.openWeather = api.getPluginInstance("openweather");
            const self = this;
            this.openWeather.register((error, openWeatherDbObject) => {
                if (!error && openWeatherDbObject) {
                    self.setValue(openWeatherDbObject.temperature, null);
                }
            }, "temperature-sensor");
        }
    }

    api.sensorAPI.registerClass(OpenweatherTemperatureSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "openweather-temperature-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Openweather temperature sensor",
    dependencies:["temperature-sensor", "openweather"]
};
