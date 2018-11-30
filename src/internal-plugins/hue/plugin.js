"use strict";


/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    api.init();

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
             * @Property("test");
             * @Type("string");
             * @Title("test");
             */
            this.test = test;
        }

        /**
         * Convert a json object to HueForm object
         *
         * @param  {Object} data Some data
         * @returns {RFlinkForm}      An instance
         */
        json(data) {
            return new HueDeviceForm(data.id, data.test);
        }
    }

    // Register the hue device form
    api.configurationAPI.register(HueDeviceForm, []);

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

            // Configure device
            api.deviceAPI.addForm("hue", HueDeviceForm, null, false);
            api.deviceAPI.registerSwitchDevice("hue", (device, formData, deviceStatus) => {
                return deviceStatus;
            });


            api.configurationAPI.setUpdateCb((data) => {
                // if (data && data.port) {
                //
                // }
            });

        }

        getProtocolList(cb) {
            cb(null, ["HUE"]);
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
    description: "Add Philips Hue support",
    dependencies:[]
};
