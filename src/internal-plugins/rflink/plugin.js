"use strict";
const RFLinkServiceClass = require("./service.js");
const request = require("request");
const parseString = require("xml2js").parseString;
const fs = require("fs-extra");
const crypto = require("crypto");

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    api.init();
    api.installerAPI.register("0.0.0", ["x32", "x64"], "brew install avrdude", false, false, true);
    api.installerAPI.register("0.0.0", ["arm", "arm64"], "apt-get install -y avrdude", true, true);

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
         * @returns {RFlinkForm}        The instance
         */
        constructor(id, port) {
            super(id);
            /**
             * @Property("port");
             * @Type("string");
             * @Title("rflink.settings.port");
             * @Enum("getPorts");
             * @EnumNames("getPorts");
             */
            this.port = port;
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
         * Convert a json object to RFLinkForm object
         *
         * @param  {Object} data Some data
         * @returns {RFlinkForm}      An instance
         */
        json(data) {
            return new RFlinkForm(data.id, data.port);
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

            const RFLinkService = RFLinkServiceClass(api);
            this.service = new RFLinkService(this);
            api.servicesManagerAPI.add(this.service);
            if (api.configurationAPI.getConfiguration() && api.configurationAPI.getConfiguration().port) {
                this.service.port = api.configurationAPI.getConfiguration().port;
            }

            api.configurationAPI.setUpdateCb((data) => {
                if (data && data.port) {
                    this.service.port = data.port;
                    this.service.restart();
                }
            });
            
            api.timeEventAPI.register(this.upgrade, this, api.timeEventAPI.constants().EVERY_DAYS);
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
         * Callback when port data is received
         *
         * @param  {Object} data A data object containing serial ports
         */
        onDetectedPortsReceive(data) {
            const ports  = [];
            data.forEach((d) => {
                if (d.manufacturer && (d.manufacturer.toLowerCase().indexOf("arduino") !== -1)) {
                    ports.push(d.endpoint);
                }
            });

            // Register the rflink form
            api.configurationAPI.register(RFlinkForm, ports);
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
            this.service.send("rflinkSend", this.formatRadioObjectBeforeSending(radioObject));
            return radioObject;
        }

        /**
         * Return the list of supported protocolList
         *
         * @param  {Function} cb A callback function `(err, protocols) => {}`
         */
        getProtocolList(cb) {
            const baseList = ["X10","AB400D","Chuango","newkaku","ev1527","elrodb","blyss","aster","warema","selectplus","kaku","tristate","ab400d","no1527","conrad","nodo_ra1527","doorbell","fa500","nodo_radiofrev1527","astrell","nodo_radi","e7","56e82","e=004041","nodo_rv1527"];
            super.getProtocolList((err, list) => {
                if (!err) {
                    list.forEach((protocol) => {
                        if (baseList.indexOf(protocol) === -1) {
                            baseList.push(protocol);
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
                request("http://www.nemcon.nl/blog2/fw/update.jsp?ver=" + context.version + "&rel=" + context.revision.toLowerCase().replace("r", ""), function(error, response, body) {
                    if (!error && body) {
                        parseString(body, function (err, result) {
                            if (!err) {
                                if (result.Result) {
                                    if (result.Result.Value && result.Result.Value.length === 1) {
                                        const updateAvailable = parseInt(result.Result.Value[0]);
                                        if (updateAvailable === 0) {
                                            context.api.exported.Logger.info("No update available");
                                        } else {
                                            context.api.exported.Logger.info("Update available");
                                            if (result.Result.Url && result.Result.Url.length === 1 && result.Result.MD5 && result.Result.MD5.length === 1) {
                                                const firmwareUrl = result.Result.Url[0];
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
                                                                        context.api.exported.Logger.info("MD5 firmware match. Continue.");
                                                                        context.reboot(context);
                                                                        context.service.stop();
                                                                        const command = "avrdude -v -p atmega2560 -c stk500 -P " + context.api.configurationAPI.getConfiguration().port + " -b 115200 -D -U flash:w:" + fwFilePath + ":i";
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
    classes:[]
};
