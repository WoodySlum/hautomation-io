"use strict";
const request = require("request");
const SUBSCRIPTION_KEY = "c401d271b92a4f29b56ef000aa07bdf3";
const CLIENT_ID = "ed334198-9da8-4a2f-ac49-831a047eda46";
const SHUTTER_STOP = -1;
const SHUTTER_OPEN = 100;
const SHUTTER_CLOSE = 0;

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    api.init();


    /**
     * This class manage Legrand device form configuration
     * @class
     */
    class LegrandDeviceForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id The identifier
         * @param {string} legrandId  The device identifier
         * @returns {LegrandDeviceForm}        The instance
         */
        constructor(id, legrandId) {
            super(id);

            /**
             * @Property("legrandId");
             * @Type("string");
             * @Title("legrand.device.id");
             * @Enum("getLegrandIds");
             * @EnumNames("getLegrandIdsLabels");
             */
            this.legrandId = legrandId;
        }

        /**
         * Form injection method for ports
         *
         * @param  {...Object} inject The ports list array
         * @returns {Array}        An array of ports
         */
        static getLegrandIds(...inject) {
            return inject[0];
        }

        /**
         * Form injection method for ports name
         *
         * @param  {...Object} inject The ports name list array
         * @returns {Array}        An array of ports name
         */
        static getLegrandIdsLabels(...inject) {
            return inject[1];
        }

        /**
         * Convert a json object to HueForm object
         *
         * @param  {Object} data Some data
         * @returns {LegrandDeviceForm}      An instance
         */
        json(data) {
            return new LegrandDeviceForm(data.id, data.legrandId);
        }
    }

    /**
     * This class manage Legrand smart things
     * @class
     */
    class Legrand {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The core APIs
         * @returns {Legrand}        The instance
         */
        constructor(api) {
            this.plant = null;
            this.modules = null;

            try {
                this.oauthData = {};
                this.oauthData = api.configurationAPI.loadData(Object, true);
                this.refreshOAuth(() => {
                    this.refreshData(() => {
                        // this.setAutomationStatus(this.plant, this.modules.automations[0], SHUTTER_CLOSE, () => {});
                    });
                });
            } catch(e) {
                api.exported.Logger.err(e);
            }


            // Refresh oauth token every hours
            api.timeEventAPI.register((self, nowHours, nowMinutes) => {
                if ((nowMinutes % 30) == 0) { // Every 30 minutes
                    self.refreshOAuth(() => {
                        self.refreshData();
                    });
                }
            }, this, api.timeEventAPI.constants().CUSTOM, "*", "*", 0, "legrand");
        }

        /**
         * oAuth callback
         *
         * @param  {Object} oAuthData The oAuth data
         */
        onOAuthData(oAuthData) {
            api.exported.Logger.info("Received oauth data");
            api.configurationAPI.saveData(oAuthData);
            this.oauthData = oAuthData;
        }

        /**
         * Get Legrand API headers
         *
         * @returns {Object}        The headers
         */
        getApiHeaders() {
            return {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
                Authorization: "Bearer " + this.oauthData.access_token
            };
        }

        /**
         * Get user plants
         *
         * @param  {Function} cb The callback `(err, data) => {}`
         */
        getUserPlants(cb) {
            const options = {
                url: "https://api.developer.legrand.com/hc/api/v1.0/plants",
                headers: this.getApiHeaders()
            };

            request(options, (err, res, body) => {
                if (err) {
                    api.exported.Logger.err(err);
                    if (cb) cb(err, null);
                } else {
                    if (cb) cb(null, JSON.parse(body));
                }
            });
        }

        /**
         * Get modules
         *
         * @param  {Object} plant The plant
         * @param  {Function} cb The callback `(err, data) => {}`
         */
        getModules(plant, cb) {
            const options = {
                url: "https://api.developer.legrand.com/hc/api/v1.0/plants/" + plant.id,
                headers: this.getApiHeaders()
            };

            request(options, (err, res, body) => {
                if (err) {
                    api.exported.Logger.err(err);
                    if (cb) cb(err, null);
                } else {
                    if (cb) cb(null, JSON.parse(body));
                }
            });
        }

        /**
         * Set automation status
         *
         * @param  {Object} plant The plant
         * @param  {Object} automation The automation to updaye
         * @param  {number} status The status (0 or 100)
         * @param  {Function} cb The callback `(err, data) => {}`
         */
        setAutomationStatus(plant, automation, status, cb) {
            const options = {
                url: "https://api.developer.legrand.com/hc/api/v1.0/automation/automation/addressLocation/plants/" + plant.id + "/modules/parameter/id/value/" + automation.sender.plant.module.id,
                method: "POST",
                headers: this.getApiHeaders(),
                json: {
                    ids: [
                        "string"
                    ],
                    level: status
                }
            };

            request(options, (err) => {
                if (err) {
                    api.exported.Logger.err(err);
                    cb(err);
                } else {
                    cb(null);
                }
            });
        }

        /**
         * Refresh oauth token
         *
         * @param  {Function} cb The callback `(err) => {}`
         */
        refreshOAuth(cb) {
            if (this.oauthData) {
                api.renewOAuthToken(api.oauth.oauth2Url, Object.assign({refresh_token: this.oauthData.refresh_token}, api.oauth.oauth2Params, {grant_type: "refresh_token"}), cb);
            } else {
                cb(Error("No oauth data, register first"));
            }

        }

        /**
         * Refresh data like plants, modules, ...
         *
         * @param  {Function} cb The callback `(err, data) => {}`
         */
        refreshData(cb) {
            this.getUserPlants((err, data) => {
                if (!err && data && data.plants && data.plants.length > 0) {
                    this.plant = data.plants[0];
                    this.getModules(this.plant, (err, data) => {
                        this.modules = data.modules;

                        const legrandIds = [];
                        const legrandIdsLabels = [];
                        this.modules.automations.forEach((automation) => {
                            legrandIds.push(automation.sender.plant.module.id);
                            legrandIdsLabels.push(automation.sender.plant.module.id);
                        });
                        api.deviceAPI.addForm("legrandDevice", LegrandDeviceForm, "legrand.form.title", true, legrandIds, legrandIdsLabels);
                        api.deviceAPI.registerSwitchDevice("legrandDevice", (device, formData, deviceStatus) => {
                            if (formData && formData.length > 0) {
                                formData.forEach((data) => {
                                    let sAutomation = null;
                                    if (this.modules && this.modules.automations) {
                                        this.modules.automations.forEach((automation) => {
                                            if (automation.sender.plant.module.id == data.legrandId) {
                                                sAutomation = automation;
                                            }
                                        });
                                    }

                                    if (sAutomation) {
                                        if (deviceStatus.getStatus() === api.deviceAPI.constants().INT_STATUS_ON) {
                                            this.setAutomationStatus(this.plant, sAutomation, SHUTTER_OPEN, (err) => {
                                                if (err) {
                                                    api.exported.Logger.err(err);
                                                }
                                            });
                                        } else if (deviceStatus.getStatus() === api.deviceAPI.constants().INT_STATUS_OFF) {
                                            this.setAutomationStatus(this.plant, sAutomation, SHUTTER_CLOSE, (err) => {
                                                if (err) {
                                                    api.exported.Logger.err(err);
                                                }
                                            });
                                        } else if (deviceStatus.getStatus() === api.deviceAPI.constants().INT_STATUS_STOP) {
                                            this.setAutomationStatus(this.plant, sAutomation, SHUTTER_STOP, (err) => {
                                                if (err) {
                                                    api.exported.Logger.err(err);
                                                }
                                            });
                                        }
                                    }

                                });
                            }

                            return deviceStatus;
                        }, api.deviceAPI.constants().DEVICE_TYPE_SHUTTER);

                        if (cb) {
                            cb();
                        }
                    });
                }
            });
        }

    }

    api.registerInstance(new Legrand(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "legrand",
    version: "0.0.0",
    category: "misc",
    description: "Legrand home - control bubendorff shutters",
    defaultDisabled: true,
    dependencies:[],
    oauth: {
        oauth1Url: "https://partners-login.eliotbylegrand.com/authorize",
        oauth1Params: {
            client_id: CLIENT_ID,
            response_type: "code"
        },
        oauth2Url: "https://partners-login.eliotbylegrand.com/token",
        oauth2Params: {
            client_id: CLIENT_ID,
            grant_type: "authorization_code",
            client_secret: "legrand_secret_key" // Key is stored on server side
        }
    }
};
