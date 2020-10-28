"use strict";

const sha256 = require("sha256");
const routerBridge = require("dialog-router-api");
const fs = require("fs-extra");
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
    * This class is used for Huawei Router form
    * @class
    */
    class HuaweiRouterForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id           Identifier
         * @param  {string} ip       The ip address
         * @param  {string} username The username
         * @param  {string} password The password
         * @param  {boolean} technoTile The technology tile
         * @returns {HuaweiRouterForm}              The instance
         */
        constructor(id, ip, username, password, technoTile) {
            super(id);

            /**
             * @Property("ip");
             * @Type("string");
             * @Title("huawei.router.ip");
             * @Regexp("[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}");
             */
            this.ip = ip;

            /**
             * @Property("username");
             * @Type("string");
             * @Title("huawei.router.username");
             */
            this.username = username;

            /**
             * @Property("password");
             * @Type("string");
             * @Title("huawei.router.password");
             * @Display("password");
             */
            this.password = password;

            /**
             * @Property("technoTile");
             * @Type("boolean");
             * @Title("huawei.router.techno.tile");
             */
            this.technoTile = technoTile;
        }

        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {HuaweiRouterForm}      A form object
         */
        json(data) {
            return new HuaweiRouterForm(data.id, data.ip, data.username, data.password, data.technoTile);
        }
    }

    api.configurationAPI.register(HuaweiRouterForm);

    /**
    * This class is used for Huawei Router form
    * @class
    */
    class HuaweiRouterScenarioForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id           Identifier
         * @param  {boolean} reboot       Reboot router
         * @returns {HuaweiRouterScenarioForm}              The instance
         */
        constructor(id, reboot = false) {
            super(id);

            /**
             * @Property("reboot");
             * @Type("boolean");
             * @Default(false);
             * @Title("huawei.router.scenario.reboot");
             */
            this.reboot = reboot;
        }

        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {HuaweiRouterScenarioForm}      A form object
         */
        json(data) {
            return new HuaweiRouterScenarioForm(data.id, data.reboot);
        }
    }

    /**
     * This class manage huawei routers
     * @class
     */
    class HuaweiRouter {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The api
         * @returns {HuaweiRouter}     The instance
         */
        constructor(api) {
            this.api = api;
            this.apiInfos = {};
            this.registeredElements = {};
            this.receivedSms = [];

            this.getApiInformations();

            const self = this;
            this.api.configurationAPI.setUpdateCb(() => {
                self.getApiInformations();
            });

            // Save box api call every hour and dispatch
            this.api.timeEventAPI.register((self) => {
                const d = new Date();
                const m = d.getMinutes();
                if ((m % 17) === 0) { // 17 for dispatching more randomly
                    self.getApiInformations();
                }

                if ((m % 5) === 0) { // Chezck every 5 minutes
                    setTimeout(() => {
                        self.getSMS();
                    }, 100);
                }
            }, this, this.api.timeEventAPI.constants().EVERY_MINUTES);

            this.api.scenarioAPI.register(HuaweiRouterScenarioForm, (scenario) => {
                if (scenario && scenario.HuaweiRouterScenarioForm && scenario.HuaweiRouterScenarioForm.reboot) {
                    this.reboot();
                }
            }, this.api.translateAPI.t("huawei.router.scenario.title"));

        }

        /**
         * Register for router informations
         *
         * @param  {Function} cb            A callback triggered when weather information is received. Example : `(error, weatherDbObject) => {}`
         * @param  {string} id            An identifier
         */
        register(cb, id = null) {
            const index = sha256(cb.toString() + id);
            this.registeredElements[index] = cb;
        }

        /**
         * Unregister router informations
         *
         * @param  {Function} cb             A callback triggered when weather information is received. Example : `(error, weatherDbObject) => {}`
         * @param  {string} id            An identifier
         */
        unregister(cb, id = null) {
            const index = sha256(cb.toString() + id);
            if (this.registeredElements[index]) {
                delete this.registeredElements[index];
            } else {
                api.exported.Logger.warn("Element not found");
            }
        }

        /**
         * Retrieve API informaitons and set to cache
         */
        getApiInformations() {
            const conf = this.api.configurationAPI.getConfiguration();
            const self = this;
            if (conf && conf.ip && conf.username && conf.password) {
                api.exported.Logger.info("Retrieving router infos");
                const router = routerBridge.create({
                    gateway: conf.ip
                });

                try {
                    router.getToken((error, token) => {
                        if (error) {
                            self.api.exported.Logger.err(error.message);
                        } else {
                            router.login(token, conf.username, conf.password, () => {
                                router.getMonthStatistics(token, function(monthlyStatsError, monthlyStatsResponse){
                                    if (monthlyStatsError) {
                                        self.api.exported.Logger.err(monthlyStatsError.message);
                                    }
                                    router.getSignal(token, function(signalStatsError, signalStatsResponse){
                                        if (signalStatsError) {
                                            self.api.exported.Logger.err(signalStatsError.message);
                                        }

                                        router.getStatus(token, function(statusStatsError, statusStatsResponse){
                                            if (statusStatsError) {
                                                self.api.exported.Logger.err(statusStatsError.message);
                                            }

                                            try {
                                                api.exported.Logger.info("Retrieved router informations");
                                                self.apiInfos = {
                                                    dataUsage: monthlyStatsResponse,
                                                    signal: signalStatsResponse,
                                                    status: statusStatsResponse
                                                };
                                                Object.keys(self.registeredElements).forEach((registeredKey) => {
                                                    self.registeredElements[registeredKey](self.apiInfos);
                                                });

                                                // Show tile
                                                if (self.apiInfos.signal && self.apiInfos.signal.mode[0] && self.apiInfos.signal.rssi[0]) {
                                                    let networkType = "-";
                                                    if (parseInt(self.apiInfos.signal.mode[0]) >= 3) {
                                                        if (parseInt(self.apiInfos.status.CurrentNetworkTypeEx) === 1011) {
                                                            networkType = "4G+";
                                                        } else {
                                                            networkType = "4G";
                                                        }
                                                    } else if (parseInt(self.apiInfos.signal.mode[0]) === 2) {
                                                        networkType = "3G";
                                                    } else if (parseInt(self.apiInfos.signal.mode[0]) === 1) {
                                                        networkType = "2G";
                                                    }

                                                    const rssi = parseInt(self.apiInfos.signal.rssi[0].replace("dBm", "").replace(">=", "").replace("<=", "").replace(">", "").replace("<", ""));
                                                    //-51 : Good signal
                                                    //-113 : Poor signal

                                                    let rssiIndicator = parseInt(100 - ((rssi - (-51)) * 100 / (-113 - -51)));
                                                    if (rssiIndicator < 0) {
                                                        rssiIndicator = 0;
                                                    } else if (rssiIndicator > 100) {
                                                        rssiIndicator = 100;
                                                    }

                                                    if (conf.technoTile) {
                                                        const background = fs.readFileSync("./res/tiles/router4g.jpg").toString("base64");
                                                        // Credits : Freepik / https://www.flaticon.com/free-icon/wifi-router_2972473
                                                        const svg = "<svg id=\"Capa_1\" enable-background=\"new 0 0 512 512\" height=\"512\" viewBox=\"0 0 512 512\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><g><path d=\"m484.446 333.955h-31.01l-8.34-252.834c-.381-11.538-9.721-20.575-21.264-20.575-11.544 0-20.885 9.038-21.265 20.575l-8.34 252.834h-54.384c-4.151 0-7.515 3.365-7.515 7.515s3.364 7.515 7.515 7.515h144.602c6.906 0 12.524 5.618 12.524 12.524v62.391c0 6.906-5.618 12.525-12.524 12.525h-315.47c-4.151 0-7.515 3.364-7.515 7.515s3.364 7.515 7.515 7.515h315.472c15.193 0 27.554-12.361 27.554-27.554v-62.391c-.001-15.194-12.362-27.555-27.555-27.555zm-66.857-252.339c.112-3.387 2.854-6.041 6.244-6.041 3.389 0 6.131 2.654 6.243 6.041l8.323 252.339h-29.133z\"/><path d=\"m138.916 436.425h-111.362c-6.906 0-12.524-5.618-12.524-12.525v-62.391c0-6.906 5.618-12.524 12.524-12.524h282.232c4.151 0 7.515-3.364 7.515-7.515 0-4.15-3.364-7.515-7.515-7.515h-192.008l-8.34-252.834c-.381-11.538-9.721-20.575-21.264-20.575-11.544 0-20.885 9.038-21.265 20.575l-3.795 115.049c-.137 4.148 3.115 7.621 7.263 7.758 4.126.106 7.621-3.115 7.758-7.263l3.795-115.049c.112-3.387 2.854-6.041 6.244-6.041 3.389 0 6.131 2.654 6.243 6.041l8.323 252.339h-29.133l3.537-107.254c.137-4.148-3.115-7.621-7.263-7.758-4.143-.131-7.622 3.115-7.758 7.263l-3.554 107.749h-31.015c-15.193 0-27.554 12.361-27.554 27.554v62.391c0 15.193 12.361 27.554 27.554 27.554h111.362c4.151 0 7.515-3.365 7.515-7.515s-3.365-7.514-7.515-7.514z\"/><path d=\"m58.241 401.189c-4.151 0-7.515 3.365-7.515 7.515s3.364 7.515 7.515 7.515h24.006c4.151 0 7.515-3.365 7.515-7.515s-3.364-7.515-7.515-7.515z\"/><path d=\"m138.916 401.189h-24.007c-4.151 0-7.515 3.365-7.515 7.515s3.364 7.515 7.515 7.515h24.007c4.151 0 7.515-3.365 7.515-7.515-.001-4.151-3.365-7.515-7.515-7.515z\"/><path d=\"m171.578 401.189c-4.151 0-7.515 3.365-7.515 7.515s3.364 7.515 7.515 7.515h24.006c4.151 0 7.515-3.365 7.515-7.515s-3.364-7.515-7.515-7.515z\"/><path d=\"m228.248 401.189c-4.151 0-7.515 3.365-7.515 7.515s3.364 7.515 7.515 7.515h24.006c4.151 0 7.515-3.365 7.515-7.515s-3.364-7.515-7.515-7.515z\"/><path d=\"m398.135 416.218c4.151 0 7.515-3.365 7.515-7.515s-3.364-7.515-7.515-7.515h-24.006c-4.151 0-7.515 3.365-7.515 7.515s3.364 7.515 7.515 7.515z\"/><path d=\"m454.032 416.218c4.151 0 7.515-3.365 7.515-7.515s-3.364-7.515-7.515-7.515h-24.006c-4.151 0-7.515 3.365-7.515 7.515s3.364 7.515 7.515 7.515z\"/><path d=\"m164.005 184.136c50.728-50.73 133.271-50.728 183.999 0 1.468 1.467 3.391 2.201 5.314 2.201s3.846-.734 5.314-2.201c2.934-2.934 2.934-7.693 0-10.627-56.589-56.589-148.666-56.59-205.255 0-2.934 2.934-2.934 7.693 0 10.627 2.935 2.935 7.693 2.935 10.628 0z\"/><path d=\"m330.129 212.639c2.934-2.935 2.934-7.693 0-10.627-40.831-40.83-107.242-40.871-148.125-.125-2.328 2.218-3.047 5.775-1.534 8.801 1.316 2.633 3.971 4.156 6.727 4.156 1.129 0 2.276-.255 3.355-.795.75-.375 1.419-.865 1.989-1.444 35.017-34.98 91.959-34.966 126.96.034 2.935 2.934 7.693 2.934 10.628 0z\"/><path d=\"m296.847 242.807c1.923 0 3.846-.734 5.314-2.201 2.934-2.934 2.934-7.693 0-10.627-12.329-12.329-28.721-19.119-46.158-19.119-17.435 0-33.828 6.79-46.158 19.119-2.935 2.934-2.935 7.693 0 10.627 2.934 2.935 7.692 2.935 10.628 0 9.49-9.49 22.109-14.717 35.529-14.717 13.422 0 26.039 5.227 35.529 14.717 1.47 1.468 3.393 2.201 5.316 2.201z\"/><path d=\"m234.347 254.425c-1.422 1.407-2.23 3.33-2.23 5.343-.093 6.659 8.347 10.031 12.872 5.27 2.948-2.927 6.858-4.539 11.015-4.539 4.177 0 8.104 1.627 11.057 4.58 7.28 6.791 17.417-3.354 10.628-10.627-11.949-11.949-31.383-11.957-43.342-.027z\"/></g></svg>";
                                                        const tile = api.dashboardAPI.Tile("huawei-router-network", api.dashboardAPI.TileType().TILE_INFO_TWO_TEXT, svg, null, api.translateAPI.t("huawei.router.router.title"), networkType + " [" + rssiIndicator + "%]", background);
                                                        api.dashboardAPI.registerTile(tile);
                                                    } else {
                                                        api.dashboardAPI.unregisterTile("huawei-router-network");
                                                    }
                                                }
                                            } catch(e) {
                                                api.exported.Logger.err(e.message);
                                            }

                                        });
                                    });
                                });
                            });
                        }
                    });
                } catch(e) {
                    self.api.exported.Logger.err(e.message);
                }

            }
        }

        /**
         * Reboot box
         */
        reboot() {
            const conf = this.api.configurationAPI.getConfiguration();
            const self = this;
            if (conf && conf.ip && conf.username && conf.password) {
                api.exported.Logger.info("Rebooting router SMS");
                const router = routerBridge.create({
                    gateway: conf.ip
                });

                try {
                    router.getToken((error, token) => {
                        if (error) {
                            self.api.exported.Logger.err(error.message);
                        } else {
                            router.login(token, conf.username, conf.password, () => {
                                router.reboot(token, (err) => {
                                    if (err) {
                                        self.api.exported.Logger.warn(err.message);
                                    } else  {
                                        self.api.exported.Logger.warn("Router rebooted !");
                                    }
                                });
                            });
                        }
                    });
                } catch(e) {
                    api.exported.Logger.err(e.message);
                }
            }
        }

        /**
         * Retrieve SMS
         */
        getSMS() {
            const conf = this.api.configurationAPI.getConfiguration();
            const self = this;
            if (conf && conf.ip && conf.username && conf.password) {
                api.exported.Logger.info("Retrieving router SMS");
                const router = routerBridge.create({
                    gateway: conf.ip
                });

                try {
                    router.getToken((error, token) => {
                        if (error) {
                            self.api.exported.Logger.err(error.message);
                        } else {
                            router.login(token, conf.username, conf.password, () => {
                                router.getAllSms(token, true, (err, messages) => {
                                    if (err) {
                                        self.api.exported.Logger.warn(err);
                                    } else if (messages.length > 0) {
                                        messages.forEach((message) => {
                                            if (self.receivedSms.indexOf(message.Date + "-" + message.Phone) === -1)  {
                                                self.receivedSms.push(message.Date + "-" + message.Phone);
                                                self.api.coreAPI.dispatchEvent("huawei-sms-event", {phoneNumber:message.Phone, date:message.Date, message:message.Content});
                                            }
                                        });
                                    }
                                });
                            });
                        }
                    });
                } catch(e) {
                    api.exported.Logger.err(e.message);
                }
            }
        }

        /**
         * Send a SMS message
         *
         * @param  {string} number  The pgone number
         * @param  {string} message the message
         */
        sendSMS(number, message) {
            const conf = this.api.configurationAPI.getConfiguration();
            const self = this;
            if (conf && conf.ip && conf.username && conf.password) {
                api.exported.Logger.info("Sending sms through router");
                const router = routerBridge.create({
                    gateway: conf.ip
                });

                try {
                    router.getToken((error, token) => {
                        if (error) {
                            self.api.exported.Logger.err(error.message);
                        } else {
                            router.login(token, conf.username, conf.password, () => {
                                router.sendSms(token, number, message, (err) => {
                                    if (err) {
                                        self.api.exported.Logger.err(err.message);
                                    }
                                });
                            });
                        }
                    });
                } catch(e) {
                    api.exported.Logger.err(e.message);
                }
            }
        }
    }

    //api.exportClass(HuaweiRouter);
    api.registerInstance(new HuaweiRouter(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "huawei-router",
    version: "0.0.0",
    category: "misc",
    defaultDisabled: true,
    description: "Huawei 3G/4G router"
};
