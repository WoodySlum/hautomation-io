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
         * @param  {string} username The usernam
         * @returns {HueForm}        The instance
         */
        constructor(id, username) {
            super(id);

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
            return new HueForm(data.id, data.username);
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
                    const user = new this.client.users.User;

                    // Optionally configure a device type / agent on the user
                    user.deviceType = "hautomation"; // Default is 'huejay'

                    this.client.users.create(user)
                    .then(user => {
                        data.username = user.username;
                        api.exported.Logger.info("Hue new user created - username : " + user.username);
                    }).catch(error => {
                        if (error instanceof huejay.Error && error.type === 101) {
                            api.exported.Logger.info("Link button not pressed. Try again...");
                        }
                    });

                    api.configurationAPI.saveData(data);
                }
                this.initClient();
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
                names.push(hueDevice.attributes.attributes.name);
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
                    if (device.HueDeviceForm && device.HueDeviceForm.device === hueDevice.attributes.attributes.id) {
                        const state = hueDevice.state.attributes;
                        const status = state.on ? context.api.deviceAPI.constants().INT_STATUS_ON : context.api.deviceAPI.constants().INT_STATUS_OFF;
                        const brightness = parseFloat(Math.round(state.bri / 254 * 10) / 10);
                        const color = colorutil.rgb.to.hex(colorutil.hsv.to.rgb({h: (Math.round((state.hue / 65534) * colorRound) / colorRound), s: (Math.round((state.sat / 254) * colorRound) / colorRound), v: 1, a: 1})).toUpperCase().replace("#", "");

                        device.status = status;
                        device.brightness = brightness;
                        device.color = color;

                        if (status != device.status || brightness != device.brightness || color != device.color) {
                            context.deviceAPI.saveDevice(device);
                        }
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
                context.api.deviceAPI.addForm("hue", HueDeviceForm, null, false, context.getHueId(), context.getHueName());
                // Switch device status
                context.api.deviceAPI.registerSwitchDevice("hue", (device, formData, deviceStatus) => {
                    context.client.lights.getById(parseInt(formData.device))
                    .then(light => {
                        light.name = device.name;
                        let brightness = device.brightness ? (device.brightness * 254) : 254;

                        if (device.status === context.api.deviceAPI.constants().INT_STATUS_ON) {
                            light.on = true;
                            light.brightness = brightness;
                        } else {
                            light.on = false;
                            light.brightness = 0;
                        }

                        light.hue        = Math.round(parseInt(colorutil.rgb.to.hsv(colorutil.hex.to.rgb("#" + device.color)).h * 65534) * colorRound) / colorRound;
                        light.saturation = Math.round(parseInt(colorutil.rgb.to.hsv(colorutil.hex.to.rgb("#" + device.color)).s * 254) * colorRound) / colorRound;

                        return context.client.lights.save(light);
                    })
                    .then(light => {
                        context.api.Logger.info.log("Updated hue light " + light.id);
                    })
                    .catch(error => {
                        context.api.Logger.err("Something went wrong when trying to change Hue");
                        context.api.Logger.err(error.stack);
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
                    for (let bridge of bridges) {
                        this.client = new huejay.Client({
                            host:     bridge.ip,
                            username: data.username
                        });
                        api.exported.Logger.info("Found bridge with IP " + bridge.ip);
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
            this.client.lights.getAll()
              .then(lights => {
                  this.hueDevices = lights;
                  cb(lights);
              });
        }
    }

    // Instantiate. Parent will store instanciation.
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
