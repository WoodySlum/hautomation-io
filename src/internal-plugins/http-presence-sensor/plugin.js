"use strict";
const LOCK_TIME = 5 * 60;
const TRIGGER_URL_WEBSERVICE_KEY = "presence/sensor/trigger";
const ROUTE_TRIGGER_URL_BASE_PATH = ":/" + TRIGGER_URL_WEBSERVICE_KEY;

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * HTTP presence form sensor
     * @class
     */
    class HttpPresenceSensorForm extends api.exported.PresenceSensorForm {
        /**
         * Radio presence sensor form
         *
         * @param  {number} id              An identifier
         * @param  {string} plugin          A plugin
         * @param  {string} name            Sensor's name
         * @param  {boolean} dashboard       True if display on dashboard, otherwise false
         * @param  {boolean} statistics      True if display on statistics, otherwise false
         * @param  {string} dashboardColor  The dashboard color
         * @param  {string} statisticsColor The statistics color
         * @param  {string} triggerUrl The trigger URL
         * @returns {HttpPresenceSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor, triggerUrl) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);

            /**
             * @Property("triggerUrl");
             * @Type("string");
             * @Readonly(true);
             * @Title("http.presence.sensor.trigger.url");
             * @Default("getUrl");
             */
            this.triggerUrl = triggerUrl;
        }

        /**
         * Returns the  url for the scenario
         *
         * @param  {...Object} inject Parameters injection on static methods
         *
         * @returns {string} A complete URL
         */
        static getUrl(...inject) {
            let randomStr = "";
            const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            const charactersLength = characters.length;
            for (var i = 0 ; i < 15 ; i++) {
                randomStr += characters.charAt(Math.floor(Math.random() * charactersLength));
            }

            return inject[0] + inject[1] + "/" + randomStr + "/";
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {HttpPresenceSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(HttpPresenceSensorForm, api.environmentAPI.getLocalAPIUrl(), TRIGGER_URL_WEBSERVICE_KEY);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class HttpPresenceSensor extends api.exported.PresenceSensor {
        /**
         * HTTP presence sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {HttpPresenceSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            this.lastEmitted = 0;
            this.token = "/";

            if (configuration && configuration.triggerUrl) {
                const urlSplit = configuration.triggerUrl.split(TRIGGER_URL_WEBSERVICE_KEY);
                if (urlSplit.length == 2) {
                    this.token = urlSplit[1];
                    api.webAPI.register(this, "*", ROUTE_TRIGGER_URL_BASE_PATH + this.token, this.api.webAPI.Authentication().AUTH_LOCAL_NETWORK_LEVEL);
                    configuration.triggerUrl = api.environmentAPI.getLocalAPIUrl() + TRIGGER_URL_WEBSERVICE_KEY + this.token;
                }

            }
        }

        /**
         * Process API callback
         *
         * @param  {[type]} apiRequest An APIRequest
         * @returns {Promise}  A promise with an APIResponse object
         */
        processAPI(apiRequest) {
            if (apiRequest.route.startsWith(ROUTE_TRIGGER_URL_BASE_PATH + this.token)) {
                return new Promise((resolve) => {
                    const timestamp = api.exported.DateUtils.class.timestamp();
                    if (this.lastEmitted < (timestamp - LOCK_TIME)) {
                        this.setValue(LOCK_TIME);
                        this.lastEmitted = timestamp;
                    }
                    resolve(this.api.webAPI.APIResponse(true, {success:true}));
                });
            }
        }
    }

    api.sensorAPI.registerClass(HttpPresenceSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "http-presence-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "HTTP presence sensor for cameras, ...",
    dependencies:["presence-sensor"]
};
