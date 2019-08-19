/* eslint-disable */
"use strict";

const request = require("request");

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class manage tv philips form configuration
     * @class
     */
    class PhilipsTvForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id The identifier
         * @param  {string} ip Ip
         * @param  {string} year API Version
         * @returns {PhilipsTvForm}        The instance
         */
        constructor(id, ip, year) {
            super(id);

            /**
             * @Property("ip");
             * @Type("object");
             * @Cl("IpScanForm");
             */
            this.ip = ip;

            /**
             * @Property("year");
             * @Title("philips.tv.year");
             * @Type("string");
             * @Default("unknown");
             * @Enum(["unknown", "2014", "2015", "2016", "2017", "2018"]);
             * @EnumNames(["philips.tv.year.unknown", "2014", "2015", "2016", "2017", "2018"]);
             */
            this.year = year;
        }


        /**
         * Convert a json object to PhilipsTvForm object
         *
         * @param  {Object} data Some data
         * @returns {PhilipsTvForm}      An instance
         */
        json(data) {
            return new PhilipsTvForm(data.id, data.ip, data.year);
        }
    }

    // Register the form
    api.configurationAPI.register(PhilipsTvForm);

    /**
     * This class is used for Philips tv
     * @class
     */
    class PhilipsTv extends api.exported.Tv {
        /**
         * Constructor
         *
         * @param {PluginAPI} api          The API
         */
        constructor(api) {
            super(api, api.translateAPI.t("philips.tv.tile.title"));
            this.getPowerState();
            this.api.timeEventAPI.register((self) => {
                self.getPowerState(null, self);
            }, this, this.api.timeEventAPI.constants().EVERY_MINUTES);
        }

        /**
         * Get the API version
         *
         * @returns {string} The API version
         */
        getApiVersion() {
            let apiVersion = "1";
            if (this.api.configurationAPI.getConfiguration() &&  this.api.configurationAPI.getConfiguration().year) {
                switch(this.api.configurationAPI.getConfiguration().apiVersion) {
                    case "unknown":
                        apiVersion = "1";
                        break;
                    case "2014":
                        apiVersion = "5";
                        break;
                    case "2015":
                        apiVersion = "5";
                        break;
                    case "2016":
                        apiVersion = "6";
                        break;
                    case "2017":
                        apiVersion = "6";
                        break;
                    case "2018":
                        apiVersion = "6";
                        break;
                }
            }

            return apiVersion;
        }

        /**
         * Get the TV power state
         * @param  {Function} [cb=null]      A callback `(powerstate) => {}`
         * @param  {PhilipsTv} [context=null] An instance (`this`)
         */
        getPowerState(cb = null, context = null) {
            if (!context) {
                context = this;
            }
            if (context.api.configurationAPI.getConfiguration() && context.api.configurationAPI.getConfiguration().ip && context.api.configurationAPI.getConfiguration().ip.ip) {
                context.get("/powerstate", (error, result) => {
                    let powerState = 0;
                    if (!error && result) {
                        if (result.powerstate.toLowerCase() === "on") {
                            powerState = 1;
                        }
                        context.update(powerState);
                        if (cb) {
                            cb(powerState);
                        }
                    } else {
                        if (cb) {
                            cb(powerState);
                        }
                    }
                });
            }
        }

        /**
         * Turn on or off TV
         */
        power() {
            this.action("standby");
        }

        /**
         * Retrieve TV api (post)
         * @param  {string}   route A route (`/input/key`)
         * @param  {Object}   data  Some data
         * @param  {Function} cb    A callback (`(error, result) => {}`)
         */
        post(route, data, cb) {
            let ip = this.api.configurationAPI.getConfiguration().ip.ip;
            if (ip === "freetext") {
                ip = this.api.configurationAPI.getConfiguration().ip.freetext;
            }
            const sData = JSON.stringify(data);
            request.post("http://" + ip + ":1925/" + this.getApiVersion() + route, {form:sData}, (error, response, body) => {
              if (cb) {
                  cb(error, body);
              }
            });
        }

        /**
         * Retrieve TV api (get)
         * @param  {string}   route A route (`/input/key`)
         * @param  {Function} cb    A callback (`(error, result) => {}`)
         */
        get(route, cb) {
            let ip = this.api.configurationAPI.getConfiguration().ip.ip;
            if (ip === "freetext") {
                ip = this.api.configurationAPI.getConfiguration().ip.freetext;
            }
            request("http://" + ip + ":1925/" + this.getApiVersion() + route, (error, response, body) => {
              if (cb) {
                  cb(error, !error ? JSON.parse(body) : null);
              }
            });
        }

        /**
         * Handle button actions
         * @param  {string} name The action name
         */
        action(name) {
            if (this.api.configurationAPI.getConfiguration() && this.api.configurationAPI.getConfiguration().ip && this.api.configurationAPI.getConfiguration().ip.ip) {
                switch(name) {
                    case "standby":
                        this.post("/input/key", {key: "Standby"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "up":
                        this.post("/input/key", {key: "CursorUp"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "down":
                        this.post("/input/key", {key: "CursorDown"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "left":
                        this.post("/input/key", {key: "CursorLeft"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "right":
                        this.post("/input/key", {key: "CursorRight"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "enter":
                        this.post("/input/key", {key: "Confirm"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "back":
                        this.post("/input/key", {key: "Back"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "home":
                        this.post("/input/key", {key: "Home"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "voldown":
                        this.post("/input/key", {key: "VolumeDown"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "volup":
                        this.post("/input/key", {key: "VolumeUp"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "mute":
                        this.post("/input/key", {key: "Mute"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "channeldown":
                        this.post("/input/key", {key: "ChannelStepDown"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "channelup":
                        this.post("/input/key", {key: "ChannelStepUp"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "rewind":
                        this.post("/input/key", {key: "Rewind"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "play":
                        this.post("/input/key", {key: "PlayPause"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "pause":
                        this.post("/input/key", {key: "PlayPause"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "record":
                        this.post("/input/key", {key: "Record"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "forward":
                        this.post("/input/key", {key: "FastForward"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                    case "source":
                        this.post("/input/key", {key: "Source"}, (error, result) => {
                            if (!result && error) {
                                api.exported.Logger.err(error);
                            }
                        });
                        break;
                }
            }
        }
    }

    const philipsTv = new PhilipsTv(api);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "philips-tv",
    version: "0.0.1",
    category: "tv",
    description: "Philips TV remote",
    dependencies:["tv"],
    defaultDisabled: true,
    classes:[]
};
