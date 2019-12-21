"use strict";
const RFLinkServiceClass = require("./service.js");
const SocatServiceClass = require("./socatService.js");
const request = require("request");
const parseString = require("xml2js").parseString;
const fs = require("fs-extra");
const crypto = require("crypto");
const sha256 = require("sha256");
const BASE_RFLINK_UPDATE_URL = "http://www.nemcon.nl/blog2/fw/update.jsp";

const RFLINK_LAN_PORT = 9999;
const RETRY_IN_SECONDS = 3;
const SEND_BUFFER_IN_MS = 500;

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    api.init();
    api.installerAPI.register(["x32", "x64"], "brew install avrdude socat", false, true, true);
    api.installerAPI.register(["arm", "arm64"], "apt-get install -y --allow-unauthenticated avrdude socat", true, true);

    const espPlugin = api.getPluginInstance("esp8266");
    const wiringSchema = api.iotAPI.getWiringSchemaForLib("esp8266");
    api.iotAPI.registerApp("app", "rflink-lan", "RFLink LAN", 1, api.iotAPI.constants().PLATFORMS.ESP8266, api.iotAPI.constants().BOARDS.NODEMCU, api.iotAPI.constants().FRAMEWORKS.ARDUINO, ["esp8266"], espPlugin.generateOptions(espPlugin.constants().MODE_ALWAYS_POWERED, 0), wiringSchema);

    /**
     * This class manage RFLink form configuration
     * @class
     */
    class RFlinkForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id The identifier
         * @param  {string} port The port
         * @param  {number} retry Retry policy
         * @param  {boolean} flash Flash Rflink
         * @returns {RFlinkForm}        The instance
         */
        constructor(id, port, retry, flash) {
            super(id);
            /**
             * @Property("port");
             * @Type("string");
             * @Title("rflink.settings.port");
             * @Enum("getPorts");
             * @EnumNames("getPortsName");
             */
            this.port = port;

            /**
             * @Property("retry");
             * @Type("string");
             * @Title("rflink.retry.policy");
             * @Enum(["0","1","2","3","4","5","10"]);
             * @EnumNames(["rflink.retry.policy.none", "rflink.retry.1s", "rflink.retry.2s", "rflink.retry.3s", "rflink.retry.4s", "rflink.retry.5s", "rflink.retry.10s"]);
             */
            this.retry = retry;

            /**
             * @Property("flash");
             * @Type("boolean");
             * @Title("rflink.flash");
             * @Default(false);
             */
            this.flash = flash;
        }

        /**
         * Form injection method for ports
         *
         * @param  {...Object} inject The ports list array
         * @returns {Array}        An array of ports
         */
        static getPorts(...inject) {
            return inject[0];
        }

        /**
         * Form injection method for ports name
         *
         * @param  {...Object} inject The ports name list array
         * @returns {Array}        An array of ports name
         */
        static getPortsName(...inject) {
            return inject[1];
        }

        /**
         * Convert a json object to RFLinkForm object
         *
         * @param  {Object} data Some data
         * @returns {RFlinkForm}      An instance
         */
        json(data) {
            return new RFlinkForm(data.id, data.port, data.retry, data.flash);
        }
    }

    // Register the rflink form
    api.configurationAPI.register(RFlinkForm, []);

    /**
     * This class manage RFLink
     * @class
     */
    class RFLink extends api.exported.Radio {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The core APIs
         * @returns {RFLink}        The instance
         */
        constructor(api) {
            super(api);
            this.api = api;
            this.version = null;
            this.revision = null;
            this.ack = null;
            this.socatService = null;
            this.retryList = {};
            this.nextSendingSlotCounter = 0;
            this.isFlashing = false;
            this.connected = false;

            const RFLinkService = RFLinkServiceClass(api);
            this.service = new RFLinkService(this);
            api.servicesManagerAPI.add(this.service);

            if (api.configurationAPI.getConfiguration() && api.configurationAPI.getConfiguration().port) {
                const port = this.startRFLinkInLanMode();
                this.service.port = port;
            }

            api.configurationAPI.setUpdateCb((data) => {
                if (data && data.port) {
                    const port = this.startRFLinkInLanMode(data.port);
                    this.service.port = port;
                    if (this.socatService) {
                        this.socatService.start();
                    }
                    this.service.restart();

                    if (data.flash) {
                        this.flashFirstInstallation(this);
                    }
                }

                data.flash = false;
                api.configurationAPI.saveData(data);
            });

            //api.timeEventAPI.register(this.upgrade, this, api.timeEventAPI.constants().EVERY_DAYS);
            if (!process.env.TEST) {
                // Fix #49
                // First installation flash
                // setTimeout((self) => {
                //     if (api.configurationAPI.getConfiguration() && api.configurationAPI.getConfiguration().port && !self.connected) {
                //         api.timeEventAPI.register(self.flashFirstInstallation, self, api.timeEventAPI.constants().EVERY_MINUTES);
                //     }
                // }, 60 * 1000, this);
            }
        }

        /**
         * Fix #49
         * On first installation, RFLink is not yet flashed and can't be used / updated.
         * We need to flash it the first time.
         * After 60 seconds, if we don't received RFLink version and a port is set through configuration, we try to download and update
         * last RFLink firmware. If it fails, the installation will give a try every minutes.
         *
         * @param  {RFLink} [context=null] The context (instance)
         */
        flashFirstInstallation(context = null) {
            if (!context) {
                context = this;
            }
            if (api.configurationAPI.getConfiguration() && api.configurationAPI.getConfiguration().port && api.configurationAPI.getConfiguration().port.length > 1 && !context.connected && !context.isFlashing) {
                api.exported.Logger.info("RFLink seems to be not flashed, trying to install it ...");
                context.service.stop();
                api.exported.Logger.info("Service has been stopped");
                api.exported.Logger.info("Downloading firmware ...");
                const fwFilePath = context.api.exported.cachePath + "rflink_base.bin";

                const flashingFunc = (firmwareHash) => {
                    fs.readFile(fwFilePath, function (hashErr, hashData) {
                        if (!hashErr) {
                            const md5 = crypto.createHash("md5").update(hashData, "utf8").digest("hex");
                            if (!firmwareHash || md5 === firmwareHash) {
                                context.api.exported.Logger.info("MD5 firmware matched. Continue.");
                                const command = "avrdude -v -p atmega2560 -c stk500 -P " + context.api.configurationAPI.getConfiguration().port + " -b 115200 -D -U flash:w:" + fwFilePath + ":i";
                                context.isFlashing = true;
                                context.api.installerAPI.executeCommand(command, false, (error, stdout, stderr) => {
                                    if (!error) {
                                        context.api.exported.Logger.info("Firmware successfully installed");
                                        context.api.messageAPI.sendMessage("*", context.api.translateAPI.t("rflink.installation.success"));
                                        context.api.exported.Logger.verbose(stdout);
                                        context.service.start();
                                    } else {
                                        context.api.exported.Logger.err("Firmware insallation error");
                                        context.api.exported.Logger.err(error.message);
                                        context.api.exported.Logger.err(stderr);
                                    }
                                    context.isFlashing = false;
                                });
                            } else {
                                context.api.exported.Logger.err("Checksum are differents ! Cannot continue");
                            }
                        }
                    });
                };

                if (!fs.existsSync(fwFilePath)) {
                    request(BASE_RFLINK_UPDATE_URL + "?ver=0&rel=0", function(error, response, body) {
                        if (!error && body) {
                            parseString(body, function (err, result) {
                                if (!err) {
                                    if (result.Result) {
                                        if (result.Result.Value && result.Result.Value.length === 1) {
                                            context.api.exported.Logger.info("Downloading last RFLink firmware ...");
                                            context.api.messageAPI.sendMessage("*", context.api.translateAPI.t("rflink.installation.downloading"));
                                            if (result.Result.Url && result.Result.Url.length === 1 && result.Result.MD5 && result.Result.MD5.length === 1) {
                                                const firmwareHash = result.Result.MD5[0];
                                                const firmwareUrl = (result.Result && result.Result.Url && result.Result.Url.length > 0)?result.Result.Url[0]:"";

                                                context.api.exported.Logger.info("URL firmware : " + firmwareUrl);
                                                context.api.exported.Logger.info("MD5 hash firmware : " + firmwareHash);
                                                request(firmwareUrl, function(fwError, fwResponse, fwBody) {
                                                    if (!fwError) {
                                                        context.api.exported.Logger.info("Firmware downloaded successfully");
                                                        fs.writeFile(fwFilePath, fwBody, (fileFwErr) => {
                                                            if (!fileFwErr) {
                                                                flashingFunc(firmwareHash);
                                                            } else {
                                                                context.api.exported.Logger.err("Could not write firmware");
                                                            }
                                                        });
                                                    } else {
                                                        context.api.exported.Logger.err("Error while downloading firmware");
                                                    }
                                                });
                                            } else {
                                                context.api.exported.Logger.err("Unexpected RFLink results insalled data");
                                            }
                                        }
                                    }
                                } else {
                                    context.api.exported.Logger.err(err.message);
                                }
                            });
                        } else {
                            context.api.exported.Logger.err(error.message);
                        }
                    });
                } else {
                    // Firmware already downloaded, trying to flash it
                    flashingFunc(null);
                }
            }
        }

        /**
         * Create the socat service for LAN connection
         * Socat will connect to the TCP socket and mount an endpoint
         *
         * @param  {string} [confPort=null] The configuration settings, port or iot identifier
         * @returns {string}          The port, if USB connected the USB endpoint, if LAN the mounted endpoint
         */
        startRFLinkInLanMode(confPort = null) {
            let port = confPort?confPort:api.configurationAPI.getConfiguration().port;
            const iotId = port; // I know  ...
            if (this.api.iotAPI.getIot(iotId)) {
                const espPlugin = api.getPluginInstance("esp8266");
                const ip = espPlugin.getIp(iotId);
                if (ip) {
                    if (this.socatService) {
                        this.api.servicesManagerAPI.remove(this.socatService);
                    }
                    const socatPort = this.api.exported.cachePath + "dev/tty"+ sha256(iotId + this.api.exported.DateUtils.class.timestamp());
                    const SocatService = SocatServiceClass(api);
                    const socatService = new SocatService(this, ip, RFLINK_LAN_PORT, socatPort);
                    // const self = this;
                    socatService.setExternalTerminatedCommandCb((service, error) => {
                        if (error) {
                            // Connection has failed, try to auto restart
                            // service.restart();
                            // self.service?self.service.restart():null;
                        }
                    });
                    this.socatService = socatService;
                    this.api.servicesManagerAPI.add(this.socatService);
                    port = socatPort;
                }
            }

            return port;
        }

        /**
         * Convert RFLink radio status to hautomation radio statuses
         *
         * @param  {string} rflinkStatus RFLink status
         * @returns {number}              Hautomationr adio status
         */
        rflinkStatusToRadioStatus(rflinkStatus) {
            let status;
            switch (rflinkStatus) {
            case "ON":
                status = this.constants().STATUS_ON;
                break;
            case "OFF":
                status = this.constants().STATUS_OFF;
                break;
            case "ALLON":
                status = this.constants().STATUS_ALL_ON;
                break;
            case "ALLOFF":
                status = this.constants().STATUS_ALL_OFF;
                break;
            default:
                status = this.constants().STATUS_ON;
                break;
            }

            return status;
        }

        /**
         * Convert Hautomation radio status to reflink format
         *
         * @param  {number} status Hautomation radio status
         * @returns {string}              RFLink format status
         */
        radioStatusToRflinkStatus(status) {
            let rflinkStatus;
            switch (parseInt(status)) {
            case this.constants().STATUS_ON:
                rflinkStatus = "ON";
                break;
            case this.constants().STATUS_OFF:
                rflinkStatus = "OFF";
                break;
            case this.constants().STATUS_ALL_ON:
                rflinkStatus = "ALLON";
                break;
            case this.constants().STATUS_ALL_OFF:
                rflinkStatus = "ALLOFF";
                break;
            default:
                rflinkStatus = this.constants().STATUS_ON;
                break;
            }

            return rflinkStatus;
        }

        /**
         * Format a DBObject to RFLink serial format
         *
         * @param  {DbRadio} radioObject A radio object
         * @returns {string}             The RFLink formatted instruction
         */
        formatRadioObjectBeforeSending(radioObject) {
            return "10;" + radioObject.protocol + ";" + radioObject.deviceId + ";" + radioObject.switchId + ";" + this.radioStatusToRflinkStatus(radioObject.status) + ";";
        }

        /**
         * Callback when an information is received from rf link service thread
         *
         * @param  {Object} data A data object containing radio informations
         */
        onRflinkReceive(data) {
            // TODO: Support values and sensors
            super.onRadioEvent(this.defaultFrequency(), data.protocol, data.code, data.subcode, null, this.rflinkStatusToRadioStatus(data.status));
        }

        /**
         * Called when version is retrieved from RFLink
         *
         * @param  {number} version  Version
         * @param  {string} revision Revision
         */
        onRflinkVersion(version, revision) {
            this.version = version;
            this.revision = revision;

            api.exported.Logger.info("RFLink version " + version + revision);
        }

        /**
         * RFLink acknowledge
         *
         * @param  {string} identifier  The acknowledge identifier
         */
        onRflinkAck(identifier) {
            this.ack = identifier;

            api.exported.Logger.verbose("Received acknowledge " + identifier);
        }

        /**
         * Callback when port data is received
         *
         * @param  {Object} data A data object containing serial ports
         */
        onDetectedPortsReceive(data) {
            const ports  = ["-"];
            const portsTitle  = ["-"];

            this.api.iotAPI.getIots("rflink-lan").forEach((d) => {
                ports.push(d.id.toString());
                portsTitle.push("LAN : " + d.name);
            });
            data.forEach((d) => {
                ports.push(d.endpoint);
                portsTitle.push("USB : " + d.endpoint);
            });

            // Register the rflink form
            api.configurationAPI.register(RFlinkForm, ports, portsTitle);
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
         * @returns {DbRadio}           A radio  object
         */
        emit(frequency, protocol, deviceId, switchId, status = null, previousStatus = null) {
            const radioObject = super.emit(frequency, protocol, deviceId, switchId, status, previousStatus);
            
            setTimeout((me) => {
                me.service.send("rflinkSend", me.formatRadioObjectBeforeSending(radioObject));

                // Retry policy
                const retry = (api.configurationAPI.getConfiguration() && api.configurationAPI.getConfiguration().retry)? parseInt(api.configurationAPI.getConfiguration().retry) : RETRY_IN_SECONDS;

                if (retry > 0) {
                    const retryHash = sha256(frequency?frequency.toString():"" + protocol?protocol.toString():"" + deviceId?deviceId.toString():"" + switchId?switchId.toString():"");
                    if (me.retryList[retryHash]) {
                        clearTimeout(me.retryList[retryHash]);
                    }

                    me.retryList[retryHash] = setTimeout((self) => {
                        self.retryList[retryHash] = null;
                        self.service.send("rflinkSend", self.formatRadioObjectBeforeSending(radioObject));
                    }, retry * 1000, me);
                }

                me.nextSendingSlotCounter--;
            }, this.nextSendingSlotCounter * SEND_BUFFER_IN_MS, this);

            this.nextSendingSlotCounter++;

            return radioObject;
        }

        /**
         * Return the list of supported protocolList
         *
         * @param  {Function} cb A callback function `(err, protocols) => {}`
         */
        getProtocolList(cb) {
            const baseList = ["x10","ab400d","chuango","newkaku","ev1527","elrodb","blyss","aster","warema","selectplus","kaku","tristate"];
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
         * Reboot the RFLink device
         *
         * @param  {RFLink} [context=null] The context. If not specified, set to `this`
         */
        reboot(context = null) {
            if (!context) {
                context = this;
            }
            context.service.send("rflinkSend", "10;REBOOT;");
        }

        /**
         * Try to upgrade RFLink firmware
         *
         * @param  {RFLink} [context=null] The context. If not specified, set to `this`
         */
        upgrade(context = null) {
            if (!context) {
                context = this;
            }

            if (context.version && context.revision && context.api.configurationAPI.getConfiguration() && context.api.configurationAPI.getConfiguration().port) {
                const currentRevision = context.revision.toLowerCase().replace("r", "");
                request(BASE_RFLINK_UPDATE_URL + "?ver=" + context.version + "&rel=" + currentRevision, function(error, response, body) {
                    if (!error && body) {
                        parseString(body, function (err, result) {
                            if (!err) {
                                if (result.Result) {
                                    if (result.Result.Value && result.Result.Value.length === 1) {
                                        let updateAvailable = parseInt(result.Result.Value[0]);
                                        // Fix #44 - RFLink updates every days
                                        const firmwareUrl = (result.Result && result.Result.Url && result.Result.Url.length > 0)?result.Result.Url[0]:"";
                                        const regex = /(.*)\/([0-9]*)\/(.*)/gm;
                                        const urlVersion =  regex.exec(firmwareUrl);

                                        if (urlVersion && urlVersion.length > 2 && parseInt(urlVersion[2]) === parseInt(currentRevision)) {
                                            context.api.exported.Logger.info("RFLink update double check done");
                                            updateAvailable = 0;
                                        }

                                        if (updateAvailable === 0) {
                                            context.api.exported.Logger.info("No update available");
                                        } else {
                                            context.api.exported.Logger.info("Update available");
                                            if (result.Result.Url && result.Result.Url.length === 1 && result.Result.MD5 && result.Result.MD5.length === 1) {
                                                const firmwareHash = result.Result.MD5[0];
                                                context.api.exported.Logger.info("URL firmware : " + firmwareUrl);
                                                context.api.exported.Logger.info("MD5 hash firmware : " + firmwareHash);
                                                request(firmwareUrl, function(fwError, fwResponse, fwBody) {
                                                    if (!fwError) {
                                                        context.api.exported.Logger.info("Firmware downloaded successfully");
                                                        const fwFilePath = context.api.exported.cachePath + "rflink.bin";
                                                        fs.removeSync(fwFilePath);
                                                        fs.writeFile(fwFilePath, fwBody, (fileFwErr) => {
                                                            if (!fileFwErr) {
                                                                fs.readFile(fwFilePath, function (hashErr, hashData) {
                                                                    const md5 = crypto.createHash("md5").update(hashData, "utf8").digest("hex");
                                                                    if (md5 === firmwareHash) {
                                                                        context.api.exported.Logger.info("MD5 firmware matched. Continue.");
                                                                        context.reboot(context);
                                                                        context.service.stop();
                                                                        const command = "avrdude -v -p atmega2560 -c stk500 -P " + context.api.configurationAPI.getConfiguration().port + " -b 115200 -D -U flash:w:" + fwFilePath + ":i";
                                                                        context.isFlashing = true;
                                                                        context.api.installerAPI.executeCommand(command, false, (error, stdout, stderr) => {
                                                                            if (!error) {
                                                                                context.api.exported.Logger.info("Firmware successfully updated");
                                                                                context.api.messageAPI.sendMessage("*", context.api.translateAPI.t("rflink.update.message"));
                                                                                context.api.exported.Logger.verbose(stdout);
                                                                            } else {
                                                                                context.api.exported.Logger.err("Firmware update error");
                                                                                context.api.exported.Logger.err(error.message);
                                                                                context.api.exported.Logger.err(stderr);
                                                                            }
                                                                            context.isFlashing = false;
                                                                            context.service.start();
                                                                        });
                                                                    } else {
                                                                        context.api.exported.Logger.err("Checksum are differents ! Cannot continue");
                                                                    }
                                                                });
                                                            } else {
                                                                context.api.exported.Logger.err(fileFwErr.message);
                                                            }
                                                        });
                                                    } else {
                                                        context.api.exported.Logger.err("Error while downloading firmware");
                                                    }
                                                });
                                            } else {
                                                context.api.exported.Logger.err("Unexpected RFLink results upgrade data");
                                            }
                                        }
                                    }
                                }
                            } else {
                                context.api.exported.Logger.err(err.message);
                            }
                        });
                    } else {
                        context.api.exported.Logger.err(error.message);
                    }
                });
            } else {
                context.api.exported.Logger.err("Invalid parameters");
            }
        }

        /**
         * Callback when rflink is connected
         */
        onConnected() {
            this.connected = true;
        }

        /**
         * Callback when rflink is disconnected
         */
        onDisconnected() {
            this.connected = false;
        }
    }

    // Instantiate. Parent will store instanciation.
    new RFLink(api);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "rflink",
    version: "0.0.0",
    category: "radio",
    description: "Manage RFLink devices",
    dependencies:["radio"],
    defaultDisabled: true,
    classes:["esp8266"]
};
