"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    const WS_SENSOR_SET_ROUTE = ":/esp/sensor/set/";
    const WS_PING_ROUTE = ":/esp/ping/";

    /**
     * Manage sensors
     * @class
     */
    class EspSensors {
        /**
         * ESP sensors class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @returns {EspSensors}                                                       The instance
         */
        constructor(api) {
            this.api = api;
            this.api.iotAPI.registerLib("app", "esp8266", 1);
            this.api.webAPI.register(this, this.api.webAPI.constants().POST, WS_SENSOR_SET_ROUTE + "[id]/[type]/[value]/[vcc*]/", this.api.webAPI.Authentication().AUTH_NO_LEVEL);
            this.api.webAPI.register(this, this.api.webAPI.constants().POST, WS_PING_ROUTE + "[id]/", this.api.webAPI.Authentication().AUTH_NO_LEVEL);
        }

        /**
         * Process API callback
         *
         * @param  {[type]} apiRequest An APIRequest
         * @returns {Promise}  A promise with an APIResponse object
         */
        processAPI(apiRequest) {
            if (apiRequest.route.startsWith(WS_SENSOR_SET_ROUTE)) {
                return new Promise((resolve, reject) => {
                    if (apiRequest.data.id && apiRequest.data.value) {
                        const sensor = this.api.sensorAPI.getSensor(parseInt(apiRequest.data.id));
                        if (sensor) {
                            sensor.setValue(parseFloat(apiRequest.data.value), apiRequest.data.vcc?parseFloat(apiRequest.data.vcc):null);
                            resolve(this.api.webAPI.APIResponse(true, {success:true}));
                        } else {
                            reject(this.api.webAPI.APIResponse(false, {}, 1080, "No sensor found"));
                        }
                    } else {
                        reject(this.api.webAPI.APIResponse(false, {}, 1081, "Invalid parameters"));
                    }
                });
            } else {
                if (apiRequest.route.startsWith(WS_PING_ROUTE)) {
                    return new Promise((resolve, reject) => {
                        resolve(this.api.webAPI.APIResponse(true, {success:true, version:this.api.iotAPI.getVersion(this.api.iotAPI.getIot(apiRequest.data.id).iotApp)}));
                    });
                }
            }

        }
    }

    api.registerInstance(new EspSensors(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "esp8266",
    version: "0.0.0",
    category: "iot",
    description: "ESP8266 base libraries and sensors manager"
};
