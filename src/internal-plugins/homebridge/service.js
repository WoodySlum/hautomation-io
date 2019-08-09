"use strict";
/* eslint no-underscore-dangle: 0 */
const hap = require("hap-nodejs");
const QRCode = require("qrcode");
const fs = require("fs-extra");
const sha256 = require("sha256");
const Server = require("./../../../node_modules/homebridge/lib/server").Server;
const Plugin = require("./../../../node_modules/homebridge/lib/plugin").Plugin;
const User = require("./../../../node_modules/homebridge/lib/user").User;
const log = require("./../../../node_modules/homebridge/lib/logger");
const port = 51826;
const WAIT_FOR_STARTING_SERVICE = 5; // Wait before starting the service (in seconds)

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    /**
     * This class starts the homebridge service
     * @class
     */
    class HomebridgeService extends api.exported.Service.class {
        /**
         * The homebridge service
         *
         * @param {Homebridge} plugin  An homebridge plugin
         * @param {Array} devices A list of hap devices
         * @param {Array} sensors A list of hap sensors
         * @returns {HomebridgeService} The instance
         */
        constructor(plugin, devices, sensors) {
            super("homebridge");
            this.plugin = plugin;
            this.removeLogs();
            this.init(devices, sensors);
        }

        /**
         * Init homebridge context
         *
         * @param {Array} devices A list of hap devices
         * @param {Array} sensors A list of hap sensors
         * @param {Array} alarm A list of hap alarm
         */
        init(devices, sensors, alarm) {
            const insecureAccess = true;
            Plugin.addPluginPath(__dirname + "/homebridge-plugins/homebridge-hautomation-lights");
            Plugin.addPluginPath(__dirname + "/homebridge-plugins/homebridge-hautomation-temperature");
            Plugin.addPluginPath(__dirname + "/homebridge-plugins/homebridge-hautomation-humidity");
            Plugin.addPluginPath(__dirname + "/homebridge-plugins/homebridge-hautomation-alarm");
            const conf = api.configurationAPI.getConfiguration() ? api.configurationAPI.getConfiguration() : {};
            if (!conf.homebridgeIdentifier) {
                const hid = api.environmentAPI.getFullHautomationId();
                conf.homebridgeIdentifier = hid.substr(0,2) + ":" + hid.substr(2,2)  + ":" + hid.substr(4,2)  + ":" + sha256(Math.floor(Math.random() * 100000000).toString()).substr(0,2) + ":" + sha256(Math.floor(Math.random() * 100000000).toString()).substr(0,2) + ":" + sha256(Math.floor(Math.random() * 100000000).toString()).substr(0,2);
                api.configurationAPI.saveData(conf);
            }

            const platforms = [];
            const pin = "021-92-278";
            if (conf.alexaUsername && conf.alexaPassword) {
                platforms.push({
                    platform: "Alexa",
                    name: "Alexa",
                    username: conf.alexaUsername,
                    password: conf.alexaPassword,
                    pin: pin
                });
            }

            try {
                this.server = new Server({insecureAccess:insecureAccess});
                this.server._config = {
                    bridge: {
                        name: "Hautomation",
                        username: conf.homebridgeIdentifier.toUpperCase(),
                        port: port,
                        pin: pin
                    },
                    accessories: devices.concat(sensors).concat(alarm),
                    platforms:platforms
                };
                hap.init(User.persistPath());
            } catch(e) {
                api.exported.Logger.err(e.message);
                api.exported.Logger.err(e.stack);
            }
        }

        /**
         * Clear homebridge cache
         */
        clearCache() {
            try {
                const path = User.persistPath();
                api.exported.Logger.info("Clear homebridge cache at path : " + path);
                fs.removeSync(path);
            } catch(e) {
                api.exported.Logger.err(e.message);
            }
        }

        /**
         * Generates a random number
         *
         * @returns {string} A random number
         */
        randomNumber() {
            return Math.floor(Math.random()*9+1).toString();
        }

        /**
         * Start the service
         */
        start() {
            super.start();
            setTimeout((self) => {
                if (self.server) {
                    try {
                        self.server.run();
                        if (typeof api.configurationAPI.getConfiguration().displayHomekitTile === "undefined" || api.configurationAPI.getConfiguration().displayHomekitTile) {
                            QRCode.toDataURL(self.server._bridge.setupURI(), { errorCorrectionLevel: "L", color:{light:api.themeAPI.getColors().clearColor + "FF", dark:api.themeAPI.getColors().tertiaryColor +"FF"}, margin:18}, (err, data) => {
                                if (!err && data) {
                                    const tile = api.dashboardAPI.Tile("homebridge", api.dashboardAPI.TileType().TILE_PICTURE_TEXT, null, null, "Homekit", null, data.split(",")[1], null, null, 99999999);
                                    tile.colors.colorContent = api.themeAPI.getColors().tertiaryColor;
                                    api.dashboardAPI.registerTile(tile);
                                }
                            });
                        }
                    } catch(e) {
                        api.exported.Logger.err(e.message);
                    }

                }
            }, WAIT_FOR_STARTING_SERVICE * 1000, this);
        }

        /**
         * Stop the service
         */
        stop() {
            api.dashboardAPI.unregisterTile("homebridge");
            api.exported.Logger.info("Stopping homebridge server");
            if (this.server) {
                this.server._teardown();
            }
            tis.server = null;
            super.stop();
        }

        /**
         * Get the pin code
         */
        getPin() {
            return (this.server ? this.server._config.bridge.pin : null);
        }

        /**
         * Remove logs
         */
        removeLogs() {
            log.Logger.prototype.log = (level, msg, ...params) => {
                msg = "Homebridge - " + msg;
                if (level === "debug") {
                    api.exported.Logger.debug(msg, params);
                } else if (level === "warn") {
                    api.exported.Logger.warn(msg, params);
                } else if (level === "error") {
                    api.exported.Logger.err(msg, params);
                } else {
                    api.exported.Logger.info(msg, params);
                }
            };
            Server.prototype._printPin = (pin) => {
                api.exported.Logger.info("Homebridge pin : " + pin);
            };
            Server.prototype._printSetupInfo = () => {};
        }

    }

    return HomebridgeService;
}

module.exports = loaded;
