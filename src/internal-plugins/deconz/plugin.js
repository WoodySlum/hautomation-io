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


    api.installerAPI.register(["arm", "arm64"], "apt-get install lsb", true, true);
    api.installerAPI.register(["arm", "arm64"], "sudo gpasswd -a $USER dialout", true, true);
    api.installerAPI.register(["arm", "arm64"], "wget -O - http://phoscon.de/apt/deconz.pub.key | sudo apt-key add -", true, true);
    api.installerAPI.register(["arm", "arm64"], "sudo sh -c \"echo 'deb http://phoscon.de/apt/deconz $(lsb_release -cs) main' > /etc/apt/sources.list.d/deconz.list\"", true, true);
    api.installerAPI.register(["arm", "arm64"], "apt-get update", true, true);
    api.installerAPI.register(["arm", "arm64"], "apt-get install deconz", true, true);

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

            const DeconzService = DeconzServiceClass(api);
            this.service = new DeconzService(this, DECONZ_HTTP_PORT);
            api.servicesManagerAPI.add(this.service);
            this.init();


            setTimeout((self) => { // Wait 30s for service start
                self.init();
            }, 30000, this);


            this.api.backupAPI.addBackupFolder(BACKUP_DIR);

            api.configurationAPI.setUpdateCb((data, username) => {
                if (data.associate) {
                    request.post({
                        headers: {"content-type" : "application/x-www-form-urlencoded"},
                        url:     "http://" + (this.ip ? this.ip : this.api.environmentAPI.getLocalIp()) + ":" + DECONZ_HTTP_PORT + "/api",
                        body:    JSON.stringify({devicetype: "hautomation-" + api.environmentAPI.getHautomationId()})
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
                    this.api.messageAPI.sendMessage([username], this.api.translateAPI.t("deconz.scan.start"));
                    this.scanDevice((err, result) => {
                        this.api.exported.Logger.verbose(JSON.stringify(result));
                        if (err) {
                            this.api.messageAPI.sendMessage([username], this.api.translateAPI.t("deconz.scan.error", err.message));
                        } else {
                            this.api.messageAPI.sendMessage([username], this.api.translateAPI.t("deconz.scan.end"));
                        }
                    });
                    data.scan = false;
                }

                api.configurationAPI.saveData(data);
                this.init();
            });
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
                    this.ip = discovered[0].internalipaddress;
                    data.url = "http://" + this.ip + ":" + DECONZ_HTTP_PORT +"/";
                    api.configurationAPI.saveData(data);
                    this.getToken((err) => {
                        if (err) {
                            api.exported.Logger.err("Could not get token for deconz : " + err.message);
                        } else {
                            this.getLights();
                            this.connectWebSocket();
                        }
                    });
                } else if (err) {
                    this.api.exported.Logger.err(err);
                } else if (!err && discovered && discovered.length == 0) {
                    let data = api.configurationAPI.getConfiguration();
                    this.ip = this.api.environmentAPI.getLocalIp();
                    data.url = "http://" + this.ip + ":" + DECONZ_HTTP_PORT +"/";
                    api.configurationAPI.saveData(data);
                    this.getToken((err) => {
                        if (err) {
                            api.exported.Logger.err("Could not get token for deconz : " + err.message);
                        } else {
                            this.getLights();
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
                headers: {"content-type" : "application/x-www-form-urlencoded", "Authorization":"Basic " + (new Buffer(login + ":" + password)).toString("base64")},
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
                        this.addDevice(key, name, (err, device) => {
                            if (!err && cb) {
                                cb(null, device);
                            }
                        });
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
            });

            if (found) {
                return this.switchLight(found.key, status, deviceStatus);
            }
        }

        /**
         * Switch a zigbee light
         *
         * @param  {string} key The device key
         * @param  {number} status  The status
         * @param  {DeviceStatus} deviceStatus  The device status : color, brightness, ...
         * @param  {Function} cb A callback e.g. `(err, status) => {}`
         */
        switchLight(key, status, deviceStatus, cb) {
            const on = (!deviceStatus.status ? false : (deviceStatus.status === super.constants().STATUS_ON || deviceStatus.status === super.constants().STATUS_ALL_ON) ? true : false);
            const bri = parseInt(deviceStatus.brightness > -1 ? (deviceStatus.brightness * 254) : 254);
            const data = {
                on: on,
                bri: bri,
                transitiontime: 9
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

            this.api.exported.Logger.debug("Switch light URL : " + this.getApiUrl() + "/lights/" + key + "/state");
            this.api.exported.Logger.debug("Switch light params : " + JSON.stringify(data));
            request.put({
                headers: {"content-type" : "application/json"},
                url:     this.getApiUrl() + "/lights/" + key + "/state",
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
                        light.protocolName = LIGHT_PREFIX + light.uniqueid;
                        this.lights.push(light);
                    });

                    this.api.radioAPI.refreshProtocols();

                    if (cb) {
                        cb(null, lights);
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
                if (d.state.presence === true) {
                    this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, (d.state.presence ? 1 : 0), this.constants().STATUS_ON, "PRESENCE");
                }
            }

            // Battery
            if (d && d.config && d.uniqueid && d.config && d.config.hasOwnProperty("battery")) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, d.config.battery, this.constants().STATUS_ON, "BATTERY");
            }

            // Temperature
            if (d && d.config && d.uniqueid && d.config && d.config.hasOwnProperty("temperature")) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, (d.config.temperature / 100), this.constants().STATUS_ON, "TEMPERATURE");
            }
            if (d && d.uniqueid && d.state && d.state.hasOwnProperty("temperature")) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, 1, (d.state.temperature / 100), this.constants().STATUS_ON, "TEMPERATURE");
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

            // Switch
            if (d && d.state && d.state.buttonevent && d.uniqueid) {
                this.onRadioEvent(2400, "zigbee", d.uniqueid, d.state.buttonevent, d.state.buttonevent, this.constants().STATUS_ON);
            }
        }

        /**
         * Connect web socket
         */
        connectWebSocket() {
            // TEST
            // const mydata = {"e":"changed","id":"5","r":"sensors","state":{"lastupdated":"2019-12-22T01:51:48","presence":false},"t":"event","uniqueid":"00:15:8d:00:04:4d:70:e0-01-0406"};
            //{"e":"changed","id":"7","r":"sensors","state":{"humidity":4596,"lastupdated":"2019-12-21T12:26:55"},"t":"event","uniqueid":"00:15:8d:00:03:f1:3b:4c-01-0405"};
            // this.processSensor(mydata);
            // process.exit(0);
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
