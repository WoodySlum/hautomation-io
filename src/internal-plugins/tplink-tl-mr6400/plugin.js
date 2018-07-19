"use strict";

const request = require("request");
const sha256 = require("sha256");
const crypto = require("crypto");

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

   /**
    * This class is used for TpLink TL-MR6400 form
    * @class
    */
    class TlMr6400Form extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id           Identifier
         * @param  {string} ip       The ip address
         * @param  {string} username The username
         * @param  {string} password The password
         * @param  {boolean} technoTile The technology tile
         * @returns {TlMr6400Form}              The instance
         */
        constructor(id, ip, username, password, technoTile) {
            super(id);

            /**
             * @Property("ip");
             * @Type("string");
             * @Title("tlmr6400.ip");
             * @Regexp("[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}");
             */
            this.ip = ip;

            /**
             * @Property("username");
             * @Type("string");
             * @Title("tlmr6400.username");
             */
            this.username = username;

            /**
             * @Property("password");
             * @Type("string");
             * @Title("tlmr6400.password");
             * @Display("password");
             */
            this.password = password;

            /**
             * @Property("technoTile");
             * @Type("boolean");
             * @Title("tlmr6400.techno.tile");
             */
            this.technoTile = technoTile;
        }

        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {TlMr6400Form}      A form object
         */
        json(data) {
            return new TlMr6400Form(data.id, data.ip, data.username, data.password, data.technoTile);
        }
    }

    api.configurationAPI.register(TlMr6400Form);

    /**
     * This class manage TPLink TlMr6400
     * @class
     */
    class TlMr6400 {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The api
         * @returns {TlMr6400}     The instance
         */
        constructor(api) {
            this.api = api;
            this.apiInfos = {};
            this.registeredElements = {};

            this.getApiInformations();

            const self = this;
            this.api.configurationAPI.setUpdateCb(() => {
                self.getApiInformations();
            });

            // Save weather every hour and dispatch
            api.timeEventAPI.register((self) => {
                self.getApiInformations();
            }, this, api.timeEventAPI.constants().EVERY_MINUTES);

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
         * Unegister router informations
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
                const jar = request.jar();
                const auth = "Basic "+ Buffer.from(conf.username + ":" + crypto.createHash("md5").update(conf.password).digest("hex")).toString("base64");
                const authCookie = "Authorization=" + escape(auth) + ";path=/";

                const options = {
                    url: "http://" + conf.ip + "/userRpm/LoginRpm.htm?Save=Save",
                    jar: jar,
                    headers: {
                        "User-Agent": "Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11",
                        "Cookie": authCookie,
                        "Accept": "/",
                        "Connection": "keep-alive"
                    }
                };

                request(options, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        const regex = /(href([ ]*)=([ ]*)\")(.*)(\")/gm;

                        let m = regex.exec(body);
                        if (m && m.length === 6) {
                            const url = m[4].replace("/userRpm/Index.htm", "/userRpm/lteWebCfg");
                            options.url = url;
                            options.headers["content-type"] = "application/x-www-form-urlencoded";
                            options.headers["Referer"] = m[4].replace("/userRpm/Index.htm", "/userRpm/StatusRpm.htm");
                            options.body = "{\"module\":\"status\",\"action\":0}";

                            request.post(options, (errorApi, responseApi, bodyApi) => {
                                if (!errorApi && responseApi.statusCode == 200) {
                                    try {
                                        api.exported.Logger.info("Retrieved router informations");
                                        self.apiInfos = JSON.parse(bodyApi);
                                        Object.keys(self.registeredElements).forEach((registeredKey) => {
                                            self.registeredElements[registeredKey](self.apiInfos);
                                        });

                                        // Show tile
                                        if (self.apiInfos.wan.signalStrength && self.apiInfos.wan.networkType) {
                                            let networkType = "-";
                                            if (self.apiInfos.wan.networkType >= 3) {
                                                networkType = "4G";
                                            } else if (self.apiInfos.wan.networkType === 2) {
                                                networkType = "3G";
                                            } else if (self.apiInfos.wan.networkType === 1) {
                                                networkType = "2G";
                                            }

                                            if (conf.technoTile) {
                                                const tile = api.dashboardAPI.Tile("tl-mr6400-network", api.dashboardAPI.TileType().TILE_INFO_TWO_TEXT, api.exported.Icons.class.list()["signal"], null, api.translateAPI.t("tlmr6400.router.title"), networkType + " [" + parseInt(self.apiInfos.wan.signalStrength / 4 * 100) + "%]");
                                                api.dashboardAPI.registerTile(tile);
                                            } else {
                                                api.dashboardAPI.unregisterTile("tl-mr6400-network");
                                            }
                                        }
                                    } catch(e) {
                                        api.exported.Logger.err(e.message);
                                    }
                                } else {
                                    api.exported.Logger.err(errorApi.messsage);
                                }
                            });
                        } else {
                            api.exported.Logger.err("No url matched");
                        }
                    } else {
                        api.exported.Logger.err(error);
                    }
                });
            }
        }
    }

    api.exportClass(TlMr6400);
    api.registerInstance(new TlMr6400(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "tplink-tl-mr6400",
    version: "0.0.0",
    category: "misc",
    description: "TPLink TL-MR6400 router"
};
