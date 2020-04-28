"use strict";
const request = require("request");
const WebSocket = require("ws");
const DeconzServiceClass = require("./service.js");
const colorutil = require("color-util");
const colorRound = 1000;
const DECONZ_HTTP_PORT = 8053;
const DECONZ_URL = "https://phoscon.de/";
const BACKUP_DIR = "/root/.local/share/dresden-elektronik/deCONZ/";
const LIGHT_PREFIX = "zigbee-light-";
const WS_SCAN_ENDPOINT = "deconz-scan/set/";
const DEFAULT_TRANSITION_TIME = 9; // Default was 9
const LOCAL_IP = "127.0.0.1";

const LIGHT_TYPE_UNKNOWN = 1;
const LIGHT_TYPE_COLOR_TEMPERATURE = 2;
const LIGHT_TYPE_DIMMABLE = 3;
const LIGHT_TYPE_EXTENDED_COLOR = 4;
const LIGHT_TYPE_RANGE_EXTENDER = 5;
const LIGHT_TYPE_WARNING = 6;

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    api.init();

    /**
     * This class manage Deconz form configuration
     * @class
     */
    class DeconzForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id The identifier
         * @param  {string} identifier The identifier
         * @param  {string} url The url
         * @param  {boolean} associate The associate flag
         * @param  {string} token The token
         * @param  {string} model The model
         * @param  {string} username The username
         * @param  {string} password The password
         * @param  {boolean} scan The scan flag
         * @returns {DeconzForm}        The instance
         */
        constructor(id, identifier, url, associate, token, model, username, password, scan) {
            super(id);

            /**
             * @Property("identifier");
             * @Type("string");
             * @Title("deconz.form.identifier");
             * @Readonly(true);
             * @Required(true);
             */
            this.identifier = identifier;

            /**
             * @Property("url");
             * @Type("string");
             * @Title("deconz.form.url");
             * @Readonly(true);
             */
            this.url = url;

            /**
             * @Property("associate");
             * @Type("boolean");
             * @Title("deconz.form.associate");
             * @Default(false);
             * @Hidden(true);
             */
            this.associate = associate;

            /**
             * @Property("token");
             * @Type("string");
             * @Title("deconz.form.token");
             * @Readonly(true);
             * @Hidden(true);
             */
            this.token = token;

            /**
             * @Property("model");
             * @Type("string");
             * @Title("deconz.form.model");
             * @Enum(["Phoscon#B1680x618"]);
             * @EnumNames(["Conbee II"]);
             * @Default("Phoscon#B1680x618");
             */
            this.model = model;

            /**
             * @Property("username");
             * @Type("string");
             * @Title("deconz.form.username");
             * @Default("delight");
             */
            this.username = username;

            /**
             * @Property("password");
             * @Type("string");
             * @Title("deconz.form.password");
             * @Display("password");
             */
            this.password = password;

            /**
             * @Property("scan");
             * @Type("boolean");
             * @Title("deconz.form.scan");
             * @Default(false);
             */
            this.scan = scan;
        }


        /**
         * Convert a json object to DeconzForm object
         *
         * @param  {Object} data Some data
         * @returns {DeconzForm}      An instance
         */
        json(data) {
            return new DeconzForm(data.id, data.identifier, data.url, data.associate, data.token, data.model, data.username, data.password, data.scan);
        }
    }

    // Register the hue form
    api.configurationAPI.register(DeconzForm);


    api.installerAPI.register(["arm", "arm64", "docker"], "apt-get install -y --allow-unauthenticated lsb", true, true);
    api.installerAPI.register(["arm", "arm64", "docker"], "sudo gpasswd -a $USER dialout", true, true);
    api.installerAPI.register(["arm", "arm64", "docker"], "wget -O - http://phoscon.de/apt/deconz.pub.key | sudo apt-key add -", true, true);
    api.installerAPI.register(["arm", "arm64", "docker"], "sudo sh -c \"echo 'deb http://phoscon.de/apt/deconz $(lsb_release -cs) main' > /etc/apt/sources.list.d/deconz.list\"", true, true);
    api.installerAPI.register(["arm", "arm64", "docker"], "apt-get update", true, true);
    api.installerAPI.register(["arm", "arm64", "docker"], "apt-get install -y --allow-unauthenticated deconz", true, true);

    /**
     * This class manage Deconz devices
     * @class
     */
    class Deconz extends api.exported.Radio {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The core APIs
         * @returns {Deconz}        The instance
         */
        constructor(api) {
            super(api);
            this.api = api;
            this.ip = null;
            this.webSocket = null;
            this.lights = [];
            this.sensors = [];

            const DeconzService = DeconzServiceClass(api);
            this.service = new DeconzService(this, DECONZ_HTTP_PORT);
            api.servicesManagerAPI.add(this.service);
            this.init();
            this.api.webAPI.register(this, this.api.webAPI.constants().POST, ":/" + WS_SCAN_ENDPOINT, this.api.webAPI.Authentication().AUTH_ADMIN_LEVEL);

            setTimeout((self) => { // Wait 30s for service start
                self.init();
            }, 30000, this);

            this.api.backupAPI.addBackupFolder(BACKUP_DIR);

            api.configurationAPI.setUpdateCb((data, username) => {
                if (data.associate) {
                    request.post({
                        headers: {"content-type" : "application/x-www-form-urlencoded"},
                        url:     "http://" + (this.ip ? this.ip : this.api.environmentAPI.getLocalIp()) + ":" + DECONZ_HTTP_PORT + "/api",
                        body:    JSON.stringify({devicetype: "smarties-" + api.environmentAPI.getSmartiesId()})
                    }, (error, response, body) => {
                        if (error) {
                            api.exported.Logger.err("Could not get token for deconz : " + error.message);
                        } else {
                            const resp = JSON.parse(body);
                            if (resp && resp.length > 0 && resp[0].success && resp[0].success.username) {
                                data.token = resp[0].success.username;
                                api.configurationAPI.saveData(data);
                            } else {
                                api.exported.Logger.err("Invalid response : " + body);
                            }
                        }
                    });
                }
                data.associate = false;
                if (data.scan) {
                    this.startScan(username);
                    data.scan = false;
                }

                api.configurationAPI.saveData(data);
                this.init();
            });

            // Update lights and sensors every 5 minutes
            api.timeEventAPI.register((self, hour, minute) => {
                if (minute % 5 == 0) {
                    self.getLights();
                    self.getSensors((err, sensors) => {
                        if (!err && sensors && sensors.length > 0 && minute == 0 && hour == 19) {
                            self.updateBatterySensors();
                        }
                    });
                }
            }, this, api.timeEventAPI.constants().EVERY_MINUTES);
        }

        /**
         * Update battery battery informations
         */
        updateBatterySensors() {
            // Simulate battery level for lowbattery property sensors
            this.sensors.forEach((sensor) => {
                if (sensor.id && sensor.config && !sensor.config.battery && sensor.state && sensor.state.hasOwnProperty("lowbattery")) {
                    if (sensor.state.lowbattery) {
                        this.onRadioEvent(2400, "zigbee", sensor.uniqueid, 1, 5, this.constants().STATUS_ON, "BATTERY");
                    } else {
                        this.onRadioEvent(2400, "zigbee", sensor.uniqueid, 1, 100, this.constants().STATUS_ON, "BATTERY");
                    }
                }

                if (sensor.id && sensor.config && sensor.config.hasOwnProperty("battery")) {
                    this.onRadioEvent(2400, "zigbee", sensor.uniqueid, 1, sensor.config.battery, this.constants().STATUS_ON, "BATTERY");
                }
            });
        }

        /**
         * Discover deconz devices
         *
         * @param  {string} username The username
         */
        startScan(username) {
            this.api.messageAPI.sendMessage([username], this.api.translateAPI.t("deconz.scan.start"));
            this.scanDevice((err, result) => {
                this.api.exported.Logger.verbose(JSON.stringify(result));
                if (err) {
                    this.api.messageAPI.sendMessage([username], this.api.translateAPI.t("deconz.scan.error", err.message));
                } else {
                    this.api.messageAPI.sendMessage([username], this.api.translateAPI.t("deconz.scan.end"));
                }
            });
        }

        /**
         * Add tile on dashboard
         */
        addTile() {
            const tile = this.api.dashboardAPI.Tile("deconz-scan", this.api.dashboardAPI.TileType().TILE_GENERIC_ACTION, this.api.exported.Icons.class.list()["rss-1"], null, this.api.translateAPI.t("deconz.tile.scan.zigbee"), null, null, null, 0, 1000100, WS_SCAN_ENDPOINT, this.api.webAPI.Authentication().AUTH_ADMIN_LEVEL);
            this.api.dashboardAPI.unregisterTile("deconz-scan");
            this.api.dashboardAPI.registerTile(tile);
        }

        /**
         * Init stuff
         */
        init() {
            this.discoverDeconz((err, discovered) => {
                if (!err && discovered && discovered.length > 0) {
                    let data = api.configurationAPI.getConfiguration();
                    if (!data) {
                        data = {};
                    }

                    data.identifier = discovered[0].id;
                    // this.ip = discovered[0].internalipaddress;
                    this.ip = LOCAL_IP;
                    data.url = "http://" + this.ip + ":" + DECONZ_HTTP_PORT +"/";
                    api.configurationAPI.saveData(data);
                    this.getToken((err) => {
                        if (err) {
                            api.exported.Logger.err("Could not get token for deconz : " + err.message);
                        } else {
                            this.addTile();
                            this.getLights();
                            this.getSensors((err, sensors) => {
                                if (!err && sensors && sensors.length > 0) {
                                    this.updateBatterySensors();
                                }
                            });
                            this.connectWebSocket();
                        }
                    });
                } else if (err) {
                    this.api.exported.Logger.err(err);
                    // Retry in 30 s
                    setTimeout((self) => {
                        self.init();
                    }, 30000, this);
                } else if (!err && discovered && discovered.length == 0) {
                    let data = api.configurationAPI.getConfiguration();
                    this.ip = LOCAL_IP;//this.api.environmentAPI.getLocalIp();
                    data.url = "http://" + this.ip + ":" + DECONZ_HTTP_PORT +"/";
                    api.configurationAPI.saveData(data);
                    this.getToken((err) => {
                        if (err) {
                            api.exported.Logger.err("Could not get token for deconz : " + err.message);
                        } else {
                            this.addTile();
                            this.getLights();
                            this.getSensors((err, sensors) => {
                                if (!err && sensors && sensors.length > 0) {
                                    this.updateBatterySensors();
                                }
                            });
                            this.connectWebSocket();
                        }
                    });
                }
            });
        }

        /**
         * Discover deconz devices
         *
         * @param  {Function} cb A callback e.g. `(err, deconzDevices) => {}`
         */
        discoverDeconz(cb) {
            request.get({
                url: DECONZ_URL + "discover"
            }, (error, response, body) => {
                if (error) {
                    this.api.exported.Logger.err("Could not discover for deconz : " + error.message);
                    if (cb) {
                        cb(error, null);
                    }
                } else {
                    const discovered = JSON.parse(body);
                    if (cb) {
                        cb(null, discovered);
                    }
                }
            });
        }

        /**
         * Get Deconz API URL
         *
         * @returns {string}           The deconz API URL
         */
        getApiUrl() {
            const data = this.api.configurationAPI.getConfiguration();
            return "http://" + (this.ip ? this.ip : this.api.environmentAPI.getLocalIp()) + ":" + DECONZ_HTTP_PORT + "/api/" + (data ? data.token : "");
        }

        /**
         * Get authentication token
         *
         * @param  {Function} cb A callback e.g. `(err, token) => {}`
         */
        getToken(cb) {
            const data = this.api.configurationAPI.getConfiguration();
            const login = data.username;
            const password = data.password;
            const model = data.model;
            request.post({
                headers: {"content-type" : "application/x-www-form-urlencoded", "Authorization":"Basic " + (Buffer.from(login + ":" + password)).toString("base64")},
                url:     "http://" + (this.ip ? this.ip : this.api.environmentAPI.getLocalIp()) + ":" + DECONZ_HTTP_PORT + "/api",
                body:    JSON.stringify({devicetype: model,login: login})
            }, (error, response, body) => {
                if (error) {
                    cb(error);
                } else {
                    const bodyJson = JSON.parse(body);
                    if (bodyJson && bodyJson.length === 1 && bodyJson[0].success && bodyJson[0].success.username) {
                        const data = this.api.configurationAPI.getConfiguration();
                        data.token = bodyJson[0].success.username;
                        this.api.configurationAPI.saveData(data);
                        api.exported.Logger.info("Token : " + data.token);
                        cb(null, bodyJson[0].success.username);
                    } else {
                        cb(Error("Could not generate token"));
                    }
                }
            });
        }

        /**
         * Add a Zigbee device
         *
         * @param  {string} key The device key
         * @param  {string} name  The name
         * @param  {Function} cb A callback e.g. `(err, status) => {}`
         * @param  {Deconz} context  The context
         */
        addDevice(key, name, cb, context = null) {
            // {"4":{"name":"Switch 4"}
            if (!context) {
                context = this;
            }

            request.put({
                headers: {"content-type" : "application/json"},
                url:     context.getApiUrl() + "/sensors/" + key,
                body:    JSON.stringify({name: name})
            }, (error, response, body) => {
                if (error) {
                    this.api.exported.Logger.err("Could not add device : " + error.message);
                    if (cb) {
                        cb(error, null);
                    }
                } else {
                    const resp = JSON.parse(body);
                    this.api.exported.Logger.info("Added device : " + body);
                    if (cb) {
                        cb(null, resp);
                    }
                }
            });
        }

        /**
         * Check scanned devices
         *
         * @param  {Function} cb A callback e.g. `(err, status) => {}`
         */
        checkScanDevice(cb) {
            request.get({
                url: this.getApiUrl() + "/sensors/new"
            }, (error, response, body) => {
                if (error) {
                    this.api.exported.Logger.err("Could check sensor : " + error.message);
                    if (cb) {
                        cb(error, null);
                    }
                } else {
                    const data = JSON.parse(body);
                    api.exported.Logger.info(data);
                    if (data && data.lastscan && data.lastscan === "active" && Object.keys(data).length === 1) {
                        // Not found yet
                        setTimeout((self) => {
                            self.checkScanDevice(cb);
                        }, 1000, this);
                    } else if (data && data.lastscan && data.lastscan === "active" && Object.keys(data).length > 1) {
                        // Found something
                        // Retrieve the key and name
                        delete data.lastscan;
                        const keys = Object.keys(data);
                        const key = keys[0];
                        const name = data[key].name;
                        this.addDevice(key, name, () => {});
                    } else if (data && data.lastscan && data.lastscan !== "active" && Object.keys(data).length === 1) {
                        if (cb) {
                            cb(null, null);
                        }
                    }
                }
            });
        }

        /**
         * Scan Zigbee devices
         *
         * @param  {Function} cb A callback e.g. `(err, devices) => {}`
         */
        scanDevice(cb) {
            request.post({
                headers: {"content-type" : "application/json; charset=utf-8"},
                url:     this.getApiUrl() + "/sensors",
                body:    JSON.stringify({})
            }, (error) => {
                if (error) {
                    this.api.exported.Logger.err("Could not scan : " + error.message);
                    if (cb) {
                        cb(error);
                    }
                } else {
                    this.checkScanDevice(cb);
                }
            });
        }

        /**
         * Emit radio request
         *
         * @param  {number} frequency The frequency
         * @param  {string} protocol  The protocol
         * @param  {string} deviceId  The device ID
         * @param  {string} switchId  The switch ID
         * @param  {number} [status=null]    The status (or enum called through `constants()`)
         * @param  {number} [previousStatus=null]    The previous object status, used if status is null to invert
         * @param  {DeviceStatus} [deviceStatus=null]    The device status (color, bright, ...)
         * @returns {DbRadio}           A radio  object
         */
        emit(frequency, protocol, deviceId, switchId, status = null, previousStatus = null, deviceStatus = null) {
            previousStatus; // Avoid lint warning :)
            let found = null;
            this.lights.forEach((light) => {
                if (light.protocolName === protocol) {
                    found = light;
                }

                if (protocol === "zigbee" && deviceId.toLowerCase() === light.uniqueid.toLowerCase()) {
                    found = light;
                }
            });

            if (found) {
                return this.switchLight(found, status, deviceStatus);
            }
        }

        /**
         * Switch a zigbee light
         *
         * @param  {Object} light The device
         * @param  {number} status  The status
         * @param  {DeviceStatus} deviceStatus  The device status : color, brightness, ...
         * @param  {Function} cb A callback e.g. `(err, status) => {}`
         */
        switchLight(light, status, deviceStatus, cb) {
            const on = (!deviceStatus.status ? false : (deviceStatus.status === super.constants().STATUS_ON || deviceStatus.status === super.constants().STATUS_ALL_ON) ? true : false);
            const bri = parseInt(deviceStatus.brightness > -1 ? (deviceStatus.brightness * 254) : 254);
            let data = {
                on: on,
                bri: bri,
                transitiontime: DEFAULT_TRANSITION_TIME
            };
            if (deviceStatus.changes.indexOf(this.api.deviceAPI.constants().ITEM_CHANGE_COLOR) >= 0) {
                const hue = Math.round(parseInt(colorutil.rgb.to.hsv(colorutil.hex.to.rgb("#" + deviceStatus.color)).h * 65534) * colorRound) / colorRound;
                data.hue = hue;
                const sat = Math.round(parseInt(colorutil.rgb.to.hsv(colorutil.hex.to.rgb("#" + deviceStatus.color)).s * 254) * colorRound) / colorRound;
                data.sat = sat;
            }

            if (deviceStatus.changes.indexOf(this.api.deviceAPI.constants().ITEM_CHANGE_COLOR_TEMP) >= 0) {
                let ct = parseInt(deviceStatus.colorTemperature > -1 ? (deviceStatus.colorTemperature * 347) : 347) + 153;
                data.ct = ct;
            }

            if (light.stype === LIGHT_TYPE_WARNING) {
                if (on) {
                    data = {alert: "lselect"};
                } else {
                    data = {alert: "none"};
                }
            }

            this.api.exported.Logger.debug("Switch light URL : " + this.getApiUrl() + "/lights/" + light.key + "/state");
            this.api.exported.Logger.debug("Switch light params : " + JSON.stringify(data));
            // {alert: "lselect"
            // alert: "none"
            request.put({
                headers: {"content-type" : "application/json"},
                url:     this.getApiUrl() + "/lights/" + light.key + "/state",
                body:    JSON.stringify(data)
            }, (error, response, body) => {
                this.api.exported.Logger.debug("Switch light results : ");
                this.api.exported.Logger.debug(error);
                this.api.exported.Logger.debug(response);
                this.api.exported.Logger.debug(body);

                if (error) {
                    this.api.exported.Logger.err("Could not switch light : " + error.message);
                    this.init(); // Try to reconnect if switch fails
                    if (cb) {
                        cb(error, null);
                    }
                } else {
                    const resp = JSON.parse(body);
                    this.api.exported.Logger.verbose("Light switch : " + body);
                    if (cb) {
                        cb(null, resp);
                    }
                }
            });

            return deviceStatus;
        }

        /**
         * Get lights
         *
         * @param  {Function} cb A callback e.g. `(err, lights) => {}`
         */
        getLights(cb) {
            this.api.exported.Logger.verbose("Retrieve lights");
            request.get({
                url: this.getApiUrl() + "/lights"
            }, (error, response, body) => {
                if (error) {
                    this.api.exported.Logger.err("Could get lights : " + error.message);
                    if (cb) {
                        cb(error, null);
                    }
                } else {
                    const lights = JSON.parse(body);
                    let keys = Object.keys(lights);

                    this.lights = [];
                    keys.forEach((key) => {
                        const light = lights[key];
                        light.key = key;
                        if (light.type.toLowerCase() == "unknown") {
                            light.stype = LIGHT_TYPE_UNKNOWN;
                        } else if (light.type.toLowerCase() == "color temperature light") {
                            light.stype = LIGHT_TYPE_COLOR_TEMPERATURE;
                        } else if (light.type.toLowerCase() == "dimmable light") {
                            light.stype = LIGHT_TYPE_DIMMABLE;
                        } else if (light.type.toLowerCase() == "extended color light") {
                            light.stype = LIGHT_TYPE_EXTENDED_COLOR;
                        } else if (light.type.toLowerCase() == "range extender") {
                            light.stype = LIGHT_TYPE_RANGE_EXTENDER;
                        } else if (light.type.toLowerCase() == "warning device") {
                            light.stype = LIGHT_TYPE_WARNING;
                        } else {
                            light.stype = LIGHT_TYPE_UNKNOWN;
                        }


                        light.protocolName = LIGHT_PREFIX + light.uniqueid;

                        this.lights.push(light);
                    });

                    this.api.exported.Logger.verbose(response);
                    this.api.radioAPI.refreshProtocols();

                    if (cb) {
                        cb(null, lights);
                    }
                }
            });
        }

        /**
         * Get sensors
         *
         * @param  {Function} cb A callback e.g. `(err, sensors) => {}`
         */
        getSensors(cb) {
            this.api.exported.Logger.verbose("Retrieve sensors");
            request.get({
                url: this.getApiUrl() + "/sensors"
            }, (error, response, body) => {
                if (error) {
                    this.api.exported.Logger.err("Could get sensors : " + error.message);
                    if (cb) {
                        cb(error, null);
                    }
                } else {
                    const sensors = JSON.parse(body);
                    this.sensors = [];
                    let keys = Object.keys(sensors);
                    const mySensors = this.api.sensorAPI.getSensors();
                    keys.forEach((key) => {
                        let sensorId = null;
                        Object.keys(mySensors).forEach((mySensorKey) => {
                            const mySensor = this.api.sensorAPI.getSensor(mySensorKey);
                            if (mySensor && mySensor.configuration && mySensor.configuration.radio && mySensor.configuration.radio.length > 0) {
                                mySensor.configuration.radio.forEach((radioObj) => {
                                    if (radioObj.module === "deconz" && radioObj.protocol === "zigbee" && radioObj.deviceId.toLowerCase() === sensors[key].uniqueid.toLowerCase()) {
                                        sensorId = mySensorKey;
                                    }
                                });
                            }
                        });

                        sensors[key].id = sensorId;
                        this.sensors.push(sensors[key]);
                    });


                    if (cb) {
                        cb(null, this.sensors);
                    }
                }
            });
        }

        /**
         * Get config
         *
         * @param  {Function} cb A callback e.g. `(err, config) => {}`
         */
        getConfig(cb) {
            request.get({
                url: this.getApiUrl() + "/config"
            }, (error, response, body) => {
                if (error) {
                    this.api.exported.Logger.err("Could get config : " + error.message);
                    if (cb) {
                        cb(error, null);
                    }
                } else {
                    const discovered = JSON.parse(body);
                    if (cb) {
                        cb(null, discovered);
                    }
                }
            });
        }

        /**
         * @override
         * Compare sensors for battery. By default, compare device id, switch id module and protocol
         *
         * @param  {DbRadio} a A db radio or db form object
         * @param  {DbRadio} b  A db radio or db form object
         * @returns {boolean}           `true` if equals, `false` otherwise
         */
        compareSensorForBattery(a, b) {
            const baseLength = 23;
            return (a.module.toString() === b.module.toString()
                && a.protocol.toString() === b.protocol.toString()
                && a.deviceId.toString().length >= baseLength && b.deviceId.toString().length >= baseLength
                && a.deviceId.toString().substr(0, baseLength) && b.deviceId.toString().substr(0, baseLength)
                && a.deviceId.toString() === b.deviceId.toString());
        }

        /**
         * Process sensor data
         *
         * @param  {Object} d Data from conbee usb key
         */
        processSensor(d) {
            // Light
            if (d && d.state && d.uniqueid && d.r == "sensors" && d.state.hasOwnProperty("lux")) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, d.state.lux, this.constants().STATUS_ON, "LIGHT");
            }

            // Presence
            if (d && d.state && d.uniqueid && d.r == "sensors" && d.state.hasOwnProperty("presence")) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, (d.state.presence ? 1 : 0), this.constants().STATUS_ON, "PRESENCE");
            }

            // Battery
            if (d && d.config && d.uniqueid && d.config && d.config.hasOwnProperty("battery")) {
                // Delay for battery - the battery messages comes often when the sensor set a value.
                // Delaying gives to system more time to store correctly values in database
                setTimeout((self) => {
                    self.onRadioEvent(2400, "zigbee", d.uniqueid, 1, d.config.battery, this.constants().STATUS_ON, "BATTERY");
                }, 10000, this);
            }

            // Temperature
            if (d && d.config && d.uniqueid && d.config && d.config.hasOwnProperty("temperature")) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, (d.config.temperature / 100), this.constants().STATUS_ON, "TEMPERATURE");
            }
            if (d && d.uniqueid && d.state && d.state.hasOwnProperty("temperature")) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, (d.state.temperature / 100), this.constants().STATUS_ON, "TEMPERATURE");
            }

            // Contact sensors
            if (d && d.config && d.uniqueid && d.config && d.config.hasOwnProperty("open")) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, (d.config.open ? 1 : 0), this.constants().STATUS_ON, "CONTACT");
            }
            if (d && d.uniqueid && d.state && d.state.hasOwnProperty("open")) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, (d.state.open ? 1 : 0), this.constants().STATUS_ON, "CONTACT");
            }

            // Humidity
            if (d && d.config && d.uniqueid && d.config && d.config.hasOwnProperty("humidity")) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, (d.config.humidity / 100), this.constants().STATUS_ON, "HUMIDITY");
            }
            if (d && d.uniqueid && d.state && d.state.hasOwnProperty("humidity")) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, (d.state.humidity / 100), this.constants().STATUS_ON, "HUMIDITY");
            }

            // Pressure
            if (d && d.config && d.uniqueid && d.config && d.config.hasOwnProperty("pressure")) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, (d.config.pressure * 100), this.constants().STATUS_ON, "PRESSURE");
            }
            if (d && d.uniqueid && d.state && d.state.hasOwnProperty("pressure")) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, (d.state.pressure * 100), this.constants().STATUS_ON, "PRESSURE");
            }

            // Water leak
            if (d && d.state && d.uniqueid && d.r == "sensors" && d.state.hasOwnProperty("water")) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, (d.state.water ? 1 : 0), this.constants().STATUS_ON, "WATER-LEAK");
            }

            // Fire
            if (d && d.state && d.uniqueid && d.r == "sensors" && d.state.hasOwnProperty("fire")) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, (d.state.fire ? 1 : 0), this.constants().STATUS_ON, "SMOKE");
            }

            // Switch
            if (d && d.state && d.state.buttonevent && d.uniqueid) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, d.state.buttonevent, d.state.buttonevent, this.constants().STATUS_ON);
            }
        }

        /**
         * Connect web socket
         */
        connectWebSocket() {
            if (this.ip) {
                this.getConfig((err, config) => {
                    try {
                        if (!err && config && config.websocketport) {
                            const added = {};
                            if (this.webSocket) {
                                this.webSocket.close();
                                this.webSocket = null;
                            }
                            this.webSocket = new WebSocket("ws://" + this.ip + ":" + config.websocketport);
                            this.webSocket.onmessage = (msg) => {
                                const d = JSON.parse(msg.data);
                                this.api.exported.Logger.info("Message received");
                                this.api.exported.Logger.info(d);

                                this.processSensor(d);

                                // Added
                                if (d && d.e && d.e === "added" && d.r && d.r === "lights") {
                                    if (!added[d.uniqueid]) {
                                        added[d.uniqueid] = true;
                                        this.api.messageAPI.sendMessage("*", this.api.translateAPI.t("deconz.message.new.light", d.uniqueid));
                                        this.getLights();
                                    }
                                }
                                if (d && d.e && d.e === "added" && d.r && d.r === "sensors" && d.sensor && d.sensor.type) {
                                    if (!added[d.uniqueid]) {
                                        added[d.uniqueid] = true;
                                        this.api.messageAPI.sendMessage("*", this.api.translateAPI.t("deconz.message.new.sensor", d.sensor.type, d.uniqueid));
                                        this.getSensors();
                                    }
                                }
                            };

                            this.webSocket.onopen = () => {
                                this.api.exported.Logger.info("Connection web socket open");
                            };

                            this.webSocket.onclose = () => {
                                this.api.exported.Logger.warn("Connection web socket closed");
                            };
                        } else if (err) {
                            this.api.exported.Logger.err("Error : " + err.message);
                        } else {
                            this.api.exported.Logger.err("No web sockets");
                        }
                    } catch (e) {
                        this.api.exported.Logger.err("Error : " + JSON.stringify(e));
                    }
                });
            }
        }

        /**
         * Return the list of supported protocolList
         *
         * @param  {Function} cb A callback function `(err, protocols) => {}`
         */
        getProtocolList(cb) {
            const baseList = ["zigbee"];
            this.lights.forEach((light) => {
                baseList.push(LIGHT_PREFIX + light.uniqueid);
            });
            super.getProtocolList((err, list) => {
                if (!err) {
                    list.forEach((protocol) => {
                        if (baseList.indexOf(protocol.toLowerCase()) === -1) {
                            baseList.push(protocol.toLowerCase());
                        }
                    });
                }

                cb(null, baseList);
            });
        }

        /**
         * Process API callback
         *
         * @param  {APIRequest} apiRequest An APIRequest
         * @returns {Promise}  A promise with an APIResponse object
         */
        processAPI(apiRequest) {
            const self = this;
            if (apiRequest.route === ":/" + WS_SCAN_ENDPOINT) {
                return new Promise((resolve) => {
                    self.startScan(apiRequest.authenticationData.username);
                    resolve(self.api.webAPI.APIResponse(true, {}));
                });
            } else {
                super.processAPI(apiRequest);
            }
        }
    }

    // Instantiate. Parent will store instanciation.
    if (!process.env.TEST) {
        new Deconz(api);
    }
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "deconz",
    version: "0.0.0",
    category: "radio",
    description: "Support zigbee protocol",
    dependencies:["radio"],
    defaultDisabled: true
};
