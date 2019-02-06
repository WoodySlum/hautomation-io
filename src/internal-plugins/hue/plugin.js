"use strict";
const huejay = require("huejay");
const colorutil = require("color-util");
const colorRound = 1000;

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    api.init();

    /**
     * This class manage Philips Hue form configuration
     * @class
     */
    class HueForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id The identifier
         * @param  {string} ip The bridge ip
         * @param  {string} username The username
         * @returns {HueForm}        The instance
         */
        constructor(id, ip, username) {
            super(id);

            /**
             * @Property("ip");
             * @Type("object");
             * @Cl("IpScanForm");
             */
            this.ip = ip;

            /**
             * @Property("username");
             * @Type("string");
             * @Title("hue.settings.username");
             */
            this.username = username;
        }


        /**
         * Convert a json object to HueForm object
         *
         * @param  {Object} data Some data
         * @returns {HueForm}      An instance
         */
        json(data) {
            return new HueForm(data.id, data.ip, data.username);
        }
    }

    // Register the hue form
    api.configurationAPI.register(HueForm);

    /**
     * This class manage Philips Hue device form configuration
     * @class
     */
    class HueDeviceForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id The identifier
         * @param  {number} device THe device
         * @returns {HueDeviceForm}        The instance
         */
        constructor(id, device) {
            super(id);

            /**
             * @Property("device");
             * @Type("string");
             * @Title("hue.device.device");
             * @Enum("getHueId");
             * @EnumNames("getHueName");
             */
            this.device = device;
        }

        /**
         * Form injection method for hue
         *
         * @param  {...Object} inject The hue list array
         * @returns {Array}        An array of hue ids
         */
        static getHueId(...inject) {
            return inject[0];
        }

        /**
         * Form injection method for ports name
         *
         * @param  {...Object} inject The hue name list array
         * @returns {Array}        An array of hue name
         */
        static getHueName(...inject) {
            return inject[1];
        }

        /**
         * Convert a json object to HueForm object
         *
         * @param  {Object} data Some data
         * @returns {HueDeviceForm}      An instance
         */
        json(data) {
            return new HueDeviceForm(data.id, data.device);
        }
    }

    /**
     * This class manage Philips Hue lights
     * @class
     */
    class Hue {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The core APIs
         * @returns {Hue}        The instance
         */
        constructor(api) {
            this.api = api;
            this.client = null;
            this.hueDevices = [];

            this.initClient();

            api.configurationAPI.setUpdateCb((data) => {
                if (!data.username || data.username.length === 0) {
                    huejay.discover()
                    .then(bridges => {
                        if (data.ip && data.ip.ip) {
                            this.client = new huejay.Client({
                                host:     (data.ip.ip === "freetext") ? data.ip.freetext : data.ip.ip,
                                username: data.username
                            });
                        } else {
                            for (let bridge of bridges) {
                                this.client = new huejay.Client({
                                    host:     bridge.ip,
                                    username: data.username
                                });
                                api.exported.Logger.info("Found bridge with IP " + bridge.ip);
                            }
                        }

                        if (this.client) {
                            const user = new this.client.users.User;

                            // Optionally configure a device type / agent on the user
                            user.deviceType = "hautomation"; // Default is 'huejay'

                            this.client.users.create(user)
                            .then(user => {
                                data.username = user.username;
                                api.exported.Logger.info("Hue new user created - username : " + user.username);
                                api.configurationAPI.saveData(data);
                                this.initClient();
                            }).catch(error => {
                                if (error instanceof huejay.Error && error.type === 101) {
                                    api.exported.Logger.info("Link button not pressed. Try again...");
                                }
                            });
                        } else {
                            api.exported.Logger.err("Bridge not found");
                        }
                    }).catch(error => {
                        api.exported.Logger.err(error.message);
                    });
                } else {
                    this.initClient();
                }
            });

            api.timeEventAPI.register((self) => {
                api.exported.Logger.verbose("Synchronizing Philips Hue lights");
                self.updateLights(self);
            }, this, api.timeEventAPI.constants().EVERY_MINUTES);
        }

        /**
         * Get lights hue IDs
         *
         * @returns {[number]} List of ids
         */
        getHueId() {
            const ids = [];
            this.hueDevices.forEach((hueDevice) => {
                ids.push(hueDevice.attributes.attributes.id);
            });
            return ids;
        }

        /**
         * Get lights hue names
         *
         * @returns {[string]} List of names
         */
        getHueName() {
            const names = [];
            this.hueDevices.forEach((hueDevice) => {
                names.push(hueDevice.attributes.attributes.id + " - " + hueDevice.attributes.attributes.name);
            });
            return names;
        }

        /**
         * Update local devices status from Hue APIs
         *
         * @param  {Hue} [context=null] The context (`this`)
         */
        updateLocalState(context = null) {
            if (!context) {
                context = this;
            }

            context.hueDevices.forEach((hueDevice) => {
                context.api.deviceAPI.getDevices().forEach((device) => {
                    if (device.HueDeviceForm && device.HueDeviceForm.length > 0) {
                        device.HueDeviceForm.forEach((subd) => {
                            if ( subd.device.toString() === hueDevice.attributes.attributes.id.toString()) {
                                const state = hueDevice.state.attributes;
                                const status = state.on ? context.api.deviceAPI.constants().INT_STATUS_ON : context.api.deviceAPI.constants().INT_STATUS_OFF;
                                const brightness = parseFloat(Math.round(state.bri / 254 * 10) / 10);
                                const color = colorutil.rgb.to.hex(colorutil.hsv.to.rgb({h: (Math.round((state.hue / 65534) * colorRound) / colorRound), s: (Math.round((state.sat / 254) * colorRound) / colorRound), v: 1, a: 1})).toUpperCase().replace("#", "");
                                const colorTemperature = parseFloat(Math.round(((state.ct - 153) / 500) * 100) / 100);
                                if (status != device.status || brightness != device.brightness || color != device.color || colorTemperature != device.colorTemperature) {
                                    device.status = status;
                                    device.brightness = brightness;
                                    device.color = color;
                                    device.colorTemperature = colorTemperature;

                                    context.api.deviceAPI.saveDevice(device);
                                }
                            }
                        });
                    }
                });
            });
        }

        /**
         * Retrieve lights from APIs
         *
         * @param  {Hue} [context=null] The context (`this`)
         */
        updateLights(context = null) {
            if (!context) {
                context = this;
            }

            context.retrieveLights(() => {
                context.updateLocalState(context);
                context.api.deviceAPI.addForm("hue", HueDeviceForm, "hue.form.title", true, context.getHueId(), context.getHueName());
                // Switch device status
                context.api.deviceAPI.registerSwitchDevice("hue", (device, formData, deviceStatus) => {
                    formData.forEach((hueDevice) => {
                        if (context.client && context.client.lights) {
                            context.client.lights.getById(parseInt(hueDevice.device))
                            .then(light => {
                                light.name = device.name;

                                // Default values if not set
                                if (!device.color) {
                                    device.color = "FFFFFF";
                                }

                                if (!device.brightness) {
                                    device.brightness = 1;
                                }

                                if (!device.colorTemperature) {
                                    device.colorTemperature = 0;
                                }

                                let brightness = parseInt(device.brightness > -1 ? (device.brightness * 254) : 254);
                                if (device.status === context.api.deviceAPI.constants().INT_STATUS_ON) {
                                    light.on = true;
                                    if (deviceStatus.changes.indexOf(context.api.deviceAPI.constants().ITEM_CHANGE_BRIGHTNESS) >= 0) {
                                        light.brightness = brightness;
                                    }

                                    if (light.state.attributes.hasOwnProperty("hue") && device.color && deviceStatus.changes.indexOf(context.api.deviceAPI.constants().ITEM_CHANGE_COLOR) >= 0) {
                                        light.hue = Math.round(parseInt(colorutil.rgb.to.hsv(colorutil.hex.to.rgb("#" + device.color)).h * 65534) * colorRound) / colorRound;
                                    }

                                    if (light.state.attributes.hasOwnProperty("sat") && device.color && deviceStatus.changes.indexOf(context.api.deviceAPI.constants().ITEM_CHANGE_COLOR) >= 0) {
                                        light.saturation = Math.round(parseInt(colorutil.rgb.to.hsv(colorutil.hex.to.rgb("#" + device.color)).s * 254) * colorRound) / colorRound;
                                    }

                                    if (light.state.attributes.hasOwnProperty("ct") && device.colorTemperature && deviceStatus.changes.indexOf(context.api.deviceAPI.constants().ITEM_CHANGE_COLOR_TEMP) >= 0) {
                                        light.colorTemp = parseInt(device.colorTemperature > -1 ? (device.colorTemperature * 347) : 347) + 153;
                                    }
                                } else {
                                    light.on = false;
                                }

                                return context.client.lights.save(light);
                            })
                            .then(light => {
                                context.api.exported.Logger.info("Updated hue light " + light.id);
                            })
                            .catch(error => {
                                context.api.exported.Logger.err("Something went wrong when trying to change Hue");
                                context.api.exported.Logger.err(error.stack);
                            });
                        }
                    });

                    return deviceStatus;
                }, context.api.deviceAPI.constants().DEVICE_TYPE_LIGHT_DIMMABLE_COLOR);
            });
        }

        /**
         * Init Hue client
         */
        initClient() {
            const data = this.api.configurationAPI.getConfiguration();

            if (data && data.username) {
                huejay.discover()
                .then(bridges => {
                    if (data.ip && data.ip.ip) {
                        this.client = new huejay.Client({
                            host:     (data.ip.ip === "freetext") ? data.ip.freetext : data.ip.ip,
                            username: data.username
                        });
                    } else {
                        for (let bridge of bridges) {
                            this.client = new huejay.Client({
                                host:     bridge.ip,
                                username: data.username
                            });
                            api.exported.Logger.info("Found bridge with IP " + bridge.ip);
                        }
                    }

                    if (this.client) {
                        this.updateLights();
                    }
                }).catch(error => {
                    api.exported.Logger.err("An error occurred : " + error.message);
                });
            }
        }

        /**
         * Retrieve all lights
         *
         * @param  {Function} cb A callback when retrieve is done
         */
        retrieveLights(cb) {
            if (this.client && this.client.lights) {
                this.client.lights.getAll()
                  .then(lights => {
                      this.hueDevices = lights;
                      cb(lights);
                  }).catch((err) => {
                      api.exported.Logger.err(err.message);
                  });
            }
        }
    }

    new Hue(api);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "hue",
    version: "0.0.0",
    category: "device",
    description: "Philips Hue support",
    dependencies:[]
};
