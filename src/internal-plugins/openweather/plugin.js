"use strict";

const WEATHER_WS = "http://api.openweathermap.org/data/2.5/weather?lat=%latitude%&lon=%longitude%&units=metric&APPID=%appid%";
const WEATHER_FORECAST_WS = "http://api.openweathermap.org/data/2.5/forecast?lat=%latitude%&lon=%longitude%&units=metric&APPID=%appid%";


function loaded(api) {
    api.init();

    class OpenWeatherForm extends api.exported.FormObject.class {
        constructor(id, apiKey) {
            super(id);
            /**
             * @Property("apiKey");
             * @Type("string");
             * @Title("openweather.api.key");
             */
            this.apiKey = apiKey;
        }

        json(data) {
            return new OpenWeatherForm(data.id, data.apiKey);
        }
    }

    api.configurationAPI.register(OpenWeatherForm);


    /**
     * This class manage openweather calls plugin
     * @class
     */
    class OpenWeather {
        constructor(api) {
            this.api = api;

        }
    }

    api.exportClass(OpenWeather);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "openweather",
    version: "0.0.0",
    category: "weather",
    description: "Openweather"
};
