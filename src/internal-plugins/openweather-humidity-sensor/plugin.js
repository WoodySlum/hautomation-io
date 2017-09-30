"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * OpenWeather humidity form sensor
     * @class
     */
    class OpenweatherHumiditySensorForm extends api.exported.HumiditySensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {OpenweatherHumiditySensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(OpenweatherHumiditySensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class OpenweatherHumiditySensor extends api.exported.HumiditySensor {
        /**
         * Open Weather Humidity sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {OpenweatherHumiditySensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            this.openWeather = api.getPluginInstance("openweather");
            const self = this;
            this.openWeather.register((error, openWeatherDbObject) => {
                if (!error && openWeatherDbObject) {
                    self.setValue(openWeatherDbObject.humidity, null);
                }
            }, "humidity-sensor");
        }
    }

    api.sensorAPI.registerClass(OpenweatherHumiditySensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "openweather-humidity-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Openweather humidity sensor",
    dependencies:["humidity-sensor", "openweather"]
};
