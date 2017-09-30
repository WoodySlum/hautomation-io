"use strict";

const request = require("request");
const sha256 = require("sha256");
const WEATHER_WS = "http://api.openweathermap.org/data/2.5/weather?lat=%latitude%&lon=%longitude%&units=metric&APPID=%appid%";
const WEATHER_FORECAST_WS = "http://api.openweathermap.org/data/2.5/forecast?lat=%latitude%&lon=%longitude%&units=metric&APPID=%appid%";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is used for Openweather database
     * @class
     */
    class OpenWeatherDb extends api.exported.DbObject.class {
        /**
         * Openweather table descriptor
         *
         * @param  {DbHelper} [dbHelper=null] A database helper
         * @param  {...Object} values          The values
         * @returns {DbObject}                 A database object
         */
        constructor(dbHelper = null, ...values) {
            super(dbHelper, ...values);

            /**
            * @Property("weatherId");
            * @Type("int");
            * @Version("0.0.0");
            */
            this.weatherId;

            /**
            * @Property("weatherName");
            * @Type("string");
            * @Version("0.0.0");
            */
            this.weatherName;

            /**
            * @Property("weatherIcon");
            * @Type("string");
            * @Version("0.0.0");
            */
            this.weatherIcon;

            /**
            * @Property("visibility");
            * @Type("int");
            * @Version("0.0.0");
            */
            this.visibility;

            /**
            * @Property("temperature");
            * @Type("int");
            * @Version("0.0.0");
            */
            this.temperature;

            /**
            * @Property("pressure");
            * @Type("int");
            * @Version("0.0.0");
            */
            this.pressure;

            /**
            * @Property("humidity");
            * @Type("int");
            * @Version("0.0.0");
            */
            this.humidity;

            /**
            * @Property("windSpeed");
            * @Type("int");
            * @Version("0.0.0");
            */
            this.windSpeed;

            /**
            * @Property("windDirection");
            * @Type("int");
            * @Version("0.0.0");
            */
            this.windDirection;

            /**
            * @Property("sunrise");
            * @Type("timestamp");
            * @Version("0.0.0");
            */
            this.sunrise;

            /**
            * @Property("sunset");
            * @Type("timestamp");
            * @Version("0.0.0");
            */
            this.sunset;
        }
    }

   /**
    * This class is used for OpenWeather form
    * @class
    */
    class OpenWeatherForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id           Identifier
         * @param  {string} apiKey       The OpenWeather API key
         * @param  {boolean} autoDayNight `true` if auto day night mode enable, `false` otherwise
         * @returns {OpenWeatherForm}              The instance
         */
        constructor(id, apiKey, autoDayNight) {
            super(id);
            /**
             * @Property("apiKey");
             * @Type("string");
             * @Title("openweather.api.key");
             */
            this.apiKey = apiKey;

            /**
             * @Property("autoDayNight");
             * @Type("boolean");
             * @Title("openweather.autoDayNight");
             */
            this.autoDayNight = autoDayNight;
        }

        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {OpenWeatherForm}      A form object
         */
        json(data) {
            return new OpenWeatherForm(data.id, data.apiKey, data.autoDayNight);
        }
    }

    api.configurationAPI.register(OpenWeatherForm);


    /**
     * This class manage openweather APIs
     * @class
     */
    class OpenWeather {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The api
         * @returns {OpenWeather}     The instance
         */
        constructor(api) {
            this.api = api;
            this.registeredElements = {};
            api.configurationAPI.register(OpenWeatherForm);

            // Register a schema
            api.databaseAPI.register(OpenWeatherDb);
            // Retrieve DbHelper
            this.dbHelper = api.databaseAPI.dbHelper(OpenWeatherDb);

            api.timeEventAPI.register((self) => {
                self.getWeather((error, dbObject) => {
                    // Dispatch callback
                    Object.keys(this.registeredElements).forEach((registeredKey) => {
                        this.registeredElements[registeredKey](error, dbObject);
                    });

                    if (!error && dbObject) {
                        dbObject.save();
                    }
                });
            }, this, api.timeEventAPI.constants().EVERY_HOURS);
        }

        /**
         * Register for weather elements
         *
         * @param  {Function} cb            A callback triggered when weather information is received. Example : `(error, radioDbObject) => {}`
         * @param  {string} id            An identifier
         */
        register(cb, id = null) {
            const index = sha256(cb.toString() + id);
            this.registeredElements[index] = cb;
        }

        /**
         * Unegister an timer element
         *
         * @param  {Function} cb             A callback triggered when radio information is received. Example : `(radioObj) => {}`
         * @param  {string} id            An identifier
         */
        unregister(cb, id = null) {
            const index = sha256(cb.toString() + id);
            if (this.registeredElements[index]) {
                delete this.registeredElements[index];
            } else {
                api.exported.Logger.warn("Element not found");
            }
        }

        /**
         * Prepare weather URL
         *
         * @param  {string} url Base template URL
         * @returns {string}     Replaced URL
         */
        prepareUrl(url) {
            // Get the configuration
            const config = api.configurationAPI.getConfiguration();
            if (config) {
                url = url.replace("%appid%", config.apiKey);
            }
            if (this.api.environmentAPI.getCoordinates()) {
                url = url.replace("%longitude%", this.api.environmentAPI.getCoordinates().longitude);
                url = url.replace("%latitude%", this.api.environmentAPI.getCoordinates().latitude);
            }

            return url;
        }

        /**
         * Get weather informations
         *
         * @param  {Function} cb A callback `(error, dbObject) => {}`
         */
        getWeather(cb) {
            const url = this.prepareUrl(WEATHER_WS);
            const self = this;
            request(url, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    const weatherInfos = JSON.parse(body);
                    if (weatherInfos.weather.length > 0) {
                        cb(null, new OpenWeatherDb(self.dbHelper, weatherInfos.weather[0].id, weatherInfos.weather[0].main, weatherInfos.weather[0].icon, weatherInfos.visibility, weatherInfos.main.temp, weatherInfos.main.pressure, weatherInfos.main.humidity, weatherInfos.wind.speed, weatherInfos.wind.deg, weatherInfos.sys.sunrise, weatherInfos.sys.sunset));
                    } else {
                        cb(Error("No weather infos"));
                    }
                } else {
                    cb(error);
                }
            });
        }
    }

    api.exportClass(OpenWeather);
    api.registerInstance(new OpenWeather(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "openweather",
    version: "0.0.0",
    category: "weather",
    description: "Openweather"
};
