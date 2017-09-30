"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * OpenWeather pressure form sensor
     * @class
     */
    class OpenweatherPressureSensorForm extends api.exported.PressureSensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {OpenweatherPressureSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(OpenweatherPressureSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class OpenweatherPressureSensor extends api.exported.PressureSensor {
        /**
         * Open Weather Pressure sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {OpenweatherPressureSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            this.openWeather = api.getPluginInstance("openweather");
            const self = this;
            this.openWeather.register((error, openWeatherDbObject) => {
                if (!error && openWeatherDbObject) {
                    self.setValue(openWeatherDbObject.pressure, null);
                }
            }, "pressure-sensor");
        }
    }

    api.sensorAPI.registerClass(OpenweatherPressureSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "openweather-pressure-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Openweather pressure sensor",
    dependencies:["pressure-sensor", "openweather"]
};
