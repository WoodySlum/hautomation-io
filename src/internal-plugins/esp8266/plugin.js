"use strict";

const fs = require("fs-extra");
const md5File = require("md5-file");

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    const WS_SENSOR_SET_ROUTE = ":/esp/sensor/set/";
    const WS_PING_ROUTE = ":/esp/ping/";
    const WS_FIRMWARE_ROUTE = ":/esp/firmware/upgrade/";
    const errorFirmware = {};

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
            this.api.iotAPI.registerLib("app", "esp8266", 23);
            this.api.webAPI.register(this, this.api.webAPI.constants().POST, WS_SENSOR_SET_ROUTE + "[id]/[type]/[value]/[vcc*]/", this.api.webAPI.Authentication().AUTH_NO_LEVEL);
            this.api.webAPI.register(this, this.api.webAPI.constants().POST, WS_PING_ROUTE + "[id]/", this.api.webAPI.Authentication().AUTH_NO_LEVEL);
            this.api.webAPI.register(this, this.api.webAPI.constants().GET, WS_FIRMWARE_ROUTE + "[id]/", this.api.webAPI.Authentication().AUTH_NO_LEVEL);
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
            } else if (apiRequest.route.startsWith(WS_PING_ROUTE)) {
                const iot = this.api.iotAPI.getIot(apiRequest.data.id);
                return new Promise((resolve, reject) => {
                    resolve(this.api.webAPI.APIResponse(true, {success:true, version:(errorFirmware[iot.iotApp]?-1:this.api.iotAPI.getVersion(this.api.iotAPI.getIot(apiRequest.data.id).iotApp))}));
                });
            } else if (apiRequest.route.startsWith(WS_FIRMWARE_ROUTE)) {


                return new Promise((resolve, reject) => {
                    const iot = this.api.iotAPI.getIot(apiRequest.data.id);
                    if (iot) {
                        this.api.iotAPI.build(iot.iotApp, false, iot, (error, details) => {
                            if (error) {
                                errorFirmware[iot.iotApp] = true;
                                api.exported.Logger.err("Locked firmware for app " + iot.iotApp + ". Firmware built failed : " + error.message);
                                reject(this.api.webAPI.APIResponse(false, {}, 1090, "Build firmware failed for id " + apiRequest.data.id));
                            } else if (details && details.firmwarePath) {
                                api.exported.Logger.err(details);
                                api.exported.Logger.info("Firmware built for app " + iot.iotApp);
                                const md5 = md5File.sync(details.firmwarePath);
                                apiRequest.res.setHeader("Content-Type", "application/octet-stream");
                                apiRequest.res.setHeader("x-MD5", md5);
                                apiRequest.res.download(details.firmwarePath);
                            } else {
                                errorFirmware[iot.iotApp] = true;
                                api.exported.Logger.err("Locked firmware for app " + iot.iotApp + ". Firmware built failed : " + error.message);
                                reject(this.api.webAPI.APIResponse(false, {}, 1091, "Build firmware failed for id " + apiRequest.data.id));
                            }
                        });
                    } else {
                        api.exported.Logger.err("Unknown iot identifier");
                        reject(this.api.webAPI.APIResponse(false, {}, 1089, "Unknown iot identifier " + apiRequest.data.id));
                    }

                });
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
