"use strict";
const md5File = require("md5-file");

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * ESP8266 form class
     * @class
     */
    class ESP8266Form extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} [id=null]         Identifier
         * @param  {string} [ssid=null]       Wifi SSID
         * @param  {string} [passphrase=null] Wifi passphrase
         * @returns {ESP8266Form}                   The instance
         */
        constructor(id = null, ssid = null, passphrase = null) {
            super(id);

            /**
             * @Property("ssid");
             * @Title("esp8266.form.wifi.ssid");
             * @Type("string");
             * @Required(true);
             */
            this.ssid = ssid;

            /**
             * @Property("passphrase");
             * @Title("esp8266.form.wifi.password");
             * @Type("string");
             * @Required(true);
             * @Display("password");
             */
            this.passphrase = passphrase;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {ESP8266Form}      An instance
         */
        json(data) {
            return new ESP8266Form(data.id, data.ssid, data.passphrase);
        }
    }

    const WS_SENSOR_SET_ROUTE = ":/esp/sensor/set/";
    const WS_PING_ROUTE = ":/esp/ping/";
    const WS_FIRMWARE_ROUTE = ":/esp/firmware/upgrade/";
    const errorFirmware = {};

    /**
     * ESP8266 manager class
     * @class
     */
    class Esp8266 {
        /**
         * ESP sensors class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @returns {EspSensors}                                                       The instance
         */
        constructor(api) {
            this.api = api;
            this.api.iotAPI.registerLib("app", "esp8266", 48, ESP8266Form);
            this.api.webAPI.register(this, this.api.webAPI.constants().POST, WS_SENSOR_SET_ROUTE + "[id]/[type]/[value]/[vcc*]/", this.api.webAPI.Authentication().AUTH_LOCAL_NETWORK_LEVEL);
            this.api.webAPI.register(this, this.api.webAPI.constants().POST, WS_PING_ROUTE + "[id]/", this.api.webAPI.Authentication().AUTH_LOCAL_NETWORK_LEVEL);
            this.api.webAPI.register(this, this.api.webAPI.constants().GET, WS_FIRMWARE_ROUTE + "[id]/", this.api.webAPI.Authentication().AUTH_LOCAL_NETWORK_LEVEL);
        }

        /**
         * ESP8266 constants :
         * Modes : `MODE_DEEP_SLEEP`, `MODE_SLEEP`, `MODE_ALWAYS_POWERED` or `MODE_LIGHT_SLEEP`
         * Time : `EVERY_HOUR`, `EVERY_DAY` or `EVERY_WEEK`
         *
         * @returns {Object} The constants
         */
        constants() {
            return {
                MODE_DEEP_SLEEP:0,
                MODE_SLEEP:1,
                MODE_ALWAYS_POWERED:2,
                MODE_LIGHT_SLEEP:3,
                EVERY_HOUR: (60 * 60),
                EVERY_DAY: (24 * 60 * 60),
                EVERY_WEEK: (7* 24 * 60 * 60)
            };
        }

        /**
         * Generate Iot app options
         *
         * @param  {int} powerMode The power mode. Can be `api.getPluginInstance("esp8266").constants().MODE_DEEP_SLEEP`, `api.getPluginInstance("esp8266").constants().MODE_SLEEP`, `api.getPluginInstance("esp8266").constants().MODE_ALWAYS_POWERED` or `api.getPluginInstance("esp8266").constants().MODE_LIGHT_SLEEP`
         * @param  {int} timer     A timer for mode deep sleep, light sleep or sleep in `seconds`. Can be a constant `api.getPluginInstance("esp8266").constants().EVERY_HOUR`, `api.getPluginInstance("esp8266").constants().EVERY_DAY` or `api.getPluginInstance("esp8266").constants().EVERY_WEEK`
         *
         * @returns {Object}           The options object
         */
        generateOptions(powerMode, timer) {
            if (powerMode < 0 || powerMode > 3) {
                throw Error("Invalid power mode");
            }

            return {
                poweredMode: powerMode,
                timer:timer
            };
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
                    // console.log(apiRequest.data);
                    if (apiRequest.data.type && apiRequest.data.id && apiRequest.data.value) {
                        const sensors = this.api.sensorAPI.getSensors(apiRequest.data.type);
                        let received = false;
                        Object.keys(sensors).forEach((sensorKey) => {
                            const sensor = this.api.sensorAPI.getSensor(sensorKey);
                            if (parseInt(apiRequest.data.id) === sensor.getIotIdentifier()) {
                                sensor.setValue(parseFloat(apiRequest.data.value), apiRequest.data.vcc?parseFloat(apiRequest.data.vcc):null);
                                received = true;
                            }
                        });

                        if (!received) {
                            api.exported.Logger.warn("No registered sensor received value");
                        }

                        resolve(this.api.webAPI.APIResponse(true, {success:true}));
                    } else {
                        reject(this.api.webAPI.APIResponse(false, {}, 1081, "Invalid parameters"));
                    }

                });
            } else if (apiRequest.route.startsWith(WS_PING_ROUTE)) {
                const iot = this.api.iotAPI.getIot(apiRequest.data.id);
                return new Promise((resolve) => {
                    console.log({success:true, version:(errorFirmware[iot.iotApp]?-1:this.api.iotAPI.getVersion(this.api.iotAPI.getIot(apiRequest.data.id).iotApp))});
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

    api.registerInstance(new Esp8266(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "esp8266",
    version: "0.0.0",
    category: "iot",
    description: "ESP8266 base libraries and sensors manager"
};
