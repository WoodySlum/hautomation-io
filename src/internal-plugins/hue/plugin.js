"use strict";


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
         * @param  {string} port The port
         * @param  {number} retry Retry policy
         * @returns {RFlinkForm}        The instance
         */
        constructor(id) {
            super(id);


        }

        /**
         * Convert a json object to RFLinkForm object
         *
         * @param  {Object} data Some data
         * @returns {RFlinkForm}      An instance
         */
        json(data) {
            return new HueForm(data.id);
        }
    }

    // Register the rflink form
    api.configurationAPI.register(HueForm, []);

    /**
     * This class manage Philips Hue lights
     * @class
     */
    class Hue extends api.exported.Radio {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The core APIs
         * @returns {Hue}        The instance
         */
        constructor(api) {
            super(api);
            this.api = api

            api.configurationAPI.setUpdateCb((data) => {
                if (data && data.port) {

                }
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
    category: "radio",
    description: "Add Philips Hue support",
    dependencies:["radio"]
};
