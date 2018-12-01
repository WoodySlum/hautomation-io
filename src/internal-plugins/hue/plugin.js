"use strict";
const huejay = require("huejay");

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
         * @param  {string} host The host
         * @param  {number} port The port
         * @param  {string} username The usernam
         * @returns {HueForm}        The instance
         */
        constructor(id, host, port, username) {
            super(id);
            /**
             * @Property("host");
             * @Type("string");
             * @Title("hue.settings.host");
             */
            this.host = host;

            /**
             * @Property("port");
             * @Type("number");
             * @Title("hue.settings.port");
             */
            this.port = port;

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
            return new HueForm(data.id, data.host, data.port, data.username);
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
         * @param  {string} port The port
         * @param  {number} retry Retry policy
         * @returns {RFlinkForm}        The instance
         */
        constructor(id, test) {
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
                this.initClient();
            });
        }

        getHueId() {
            const ids = [];
            this.hueDevices.forEach((hueDevice) => {
                ids.push(hueDevice.attributes.attributes.id);
            });
            return ids;
        }

        getHueName() {
            const names = [];
            this.hueDevices.forEach((hueDevice) => {
                names.push(hueDevice.attributes.attributes.name);
            });
            return names;
        }

        initClient() {
            const data = this.api.configurationAPI.getConfiguration();
            const self = this;
            if (data && data.host && data.port && data .username) {
                self.client = new huejay.Client({
                  host:     data.host,
                  port:     data.port,
                  timeout:  15000,
                  username: data.username
                });
                self.retrieveLights(() => {
                    api.deviceAPI.addForm("hue", HueDeviceForm, null, false, self.getHueId(), self.getHueName());
                    // Configure device
                    api.deviceAPI.registerSwitchDevice("hue", (device, formData, deviceStatus) => {
                        this.client.lights.getById(parseInt(formData.device))
                          .then(light => {
                            light.name = device.name;
                            let brightness = device.brightness ? (device.brightness * 254) : 254;

                            if (device.status === api.deviceAPI.constants().INT_STATUS_ON) {
                                light.brightness = brightness;
                            } else {
                                light.brightness = 0;
                            }

                            light.hue        = 65534;
                            light.saturation = 254;

                            return this.client.lights.save(light);
                          })
                          .then(light => {
                            console.log(`Updated light [${light.id}]`);
                          })
                          .catch(error => {
                            console.log('Something went wrong');
                            console.log(error.stack);
                          });

                        return deviceStatus;
                    }, api.deviceAPI.constants().DEVICE_TYPE_LIGHT_DIMMABLE_COLOR);
                });
            }
        }

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
