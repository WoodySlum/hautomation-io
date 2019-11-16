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

    const CONF_KEY = "esp8266";
    const WS_SENSOR_SET_ROUTE = ":/esp/sensor/set/";
    const WS_PING_ROUTE = ":/esp/ping/";
    const WS_FIRMWARE_ROUTE = ":/esp/firmware/upgrade/";
    const PING_EVENT_KEY = "esp8266-ping";
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
            const wiringSchema = {left:{"A0":[],"RSV-1":[],"RSV-2":[],"SD3":[],"SD2":[],"SD1":[],"CMD":[],"SD0":[],"CLK":[],"GND-1":[],"3V3":[],"EN":[],"RST":[],"GND-2":[],"VIN":[]}, right:{"D0":[],"D1":[],"D2":[],"D3":[],"D4":[],"3V3-1":[],"GND-1":[],"D5":[],"D6":[],"D7":[],"D8":[],"RX":[],"TX":[],"GND-2":[],"3V3-2":[]}, down:{"USB":["RPI or POWER"]}};
            this.api.iotAPI.registerLib("app", "esp8266", 57, wiringSchema, ESP8266Form);
            this.api.iotAPI.addIngredientForReceipe("esp8266", "Nodemcu v1", "Nodemcu board, based on ESP8266", 1, true, true);
            this.api.webAPI.register(this, this.api.webAPI.constants().POST, WS_SENSOR_SET_ROUTE + "[id]/[type]/[value]/[vcc*]/", this.api.webAPI.Authentication().AUTH_LOCAL_NETWORK_LEVEL);
            this.api.webAPI.register(this, this.api.webAPI.constants().POST, WS_PING_ROUTE + "[id]/", this.api.webAPI.Authentication().AUTH_LOCAL_NETWORK_LEVEL);
            this.api.webAPI.register(this, this.api.webAPI.constants().GET, WS_FIRMWARE_ROUTE + "[id]/", this.api.webAPI.Authentication().AUTH_LOCAL_NETWORK_LEVEL);
            this.firmwareFile = {};

            try {
                this.configurations = this.api.configurationAPI.getConfManager().loadData(Object, CONF_KEY, true);
            } catch(err) {
                this.api.exported.Logger.verbose(err.message);
            }

            if (!this.configurations) {
                this.configurations = {};
            } else {
                // Dispatch pings initial after 5 seconds for dependent plugins
                setTimeout((self) => {
                    Object.keys(this.configurations).forEach((iotKey) => {
                        self.api.coreAPI.dispatchEvent(PING_EVENT_KEY, Object.assign({id:iotKey}, self.configurations[iotKey]));
                    });
                }, 5000, this);
            }
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
                EVERY_WEEK: (7* 24 * 60 * 60),
                PING_EVENT_KEY: PING_EVENT_KEY
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
         * Return the IoT ip address
         *
         * @param  {string} iotId IoT identifier
         * @returns {string|null}       The ip address. `null` if no ip found
         */
        getIp(iotId) {
            if (this.configurations[iotId.toString()] && this.configurations[iotId.toString()].ip) {
                return this.configurations[iotId.toString()].ip;
            }
        }

        /**
         * Process API callback
         *
         * @param  {APIRequest} apiRequest An APIRequest
         * @returns {Promise}  A promise with an APIResponse object
         */
        processAPI(apiRequest) {
            if (apiRequest.route.startsWith(WS_SENSOR_SET_ROUTE)) {
                return new Promise((resolve, reject) => {
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
                if (iot) {
                    this.configurations[iot.id.toString()] = apiRequest.params;
                    this.configurations[iot.id.toString()].lastUpdated = this.api.exported.DateUtils.class.timestamp();
                    this.api.coreAPI.dispatchEvent(PING_EVENT_KEY, Object.assign({id:iot.id.toString()}, this.configurations[iot.id.toString()]));
                    this.api.configurationAPI.getConfManager().saveData(this.configurations, CONF_KEY);
                }

                return new Promise((resolve) => {
                    resolve(this.api.webAPI.APIResponse(true, {success:true, version:((this.api.iotAPI.isBuilding() || errorFirmware[iot.iotApp])?-1:this.api.iotAPI.getVersion(this.api.iotAPI.getIot(apiRequest.data.id).iotApp))}));
                });
            } else if (apiRequest.route.startsWith(WS_FIRMWARE_ROUTE)) {
                return new Promise((resolve, reject) => {
                    const iot = this.api.iotAPI.getIot(apiRequest.data.id);
                    if (this.api.iotAPI.isBuilding()) {
                        reject(this.api.webAPI.APIResponse(false, {}, 1079, "Build is already running"));
                    } else if (iot) {
                        // We need to build firmware on first time
                        if (!this.firmwareFile[apiRequest.data.id]) {
                            this.api.iotAPI.build(iot.iotApp, false, iot, (error, details) => {
                                if (error) {
                                    // Error
                                    errorFirmware[iot.iotApp] = true;
                                    api.exported.Logger.err("Locked firmware for app " + iot.iotApp + ". Firmware built failed : " + error.message);
                                    api.exported.Logger.err("Build firmware failed for id (1090)" + apiRequest.data.id);
                                    delete this.firmwareFile[apiRequest.data.id];
                                } else if (details && details.firmwarePath) {
                                    // Success
                                    this.firmwareFile[apiRequest.data.id] = details.firmwarePath;
                                    api.exported.Logger.info(details);
                                    api.exported.Logger.info("Firmware built for app " + iot.iotApp);
                                } else {
                                    // Error : success without generated firmware
                                    errorFirmware[iot.iotApp] = true;
                                    api.exported.Logger.err("Locked firmware for app " + iot.iotApp + ". Firmware built failed : " + error.message);
                                    api.exported.Logger.err("Build firmware failed for id (1091)" + apiRequest.data.id);
                                    delete this.firmwareFile[apiRequest.data.id];
                                }
                            });
                            reject(this.api.webAPI.APIResponse(false, {}, 1095, "Building firmware"));
                        } else {
                            // On second time, download firmware
                            const md5 = md5File.sync(this.firmwareFile[apiRequest.data.id]);
                            apiRequest.res.setHeader("Content-Type", "application/octet-stream");
                            apiRequest.res.setHeader("x-MD5", md5);
                            apiRequest.res.download(this.firmwareFile[apiRequest.data.id]);
                            delete this.firmwareFile[apiRequest.data.id];
                        }

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
