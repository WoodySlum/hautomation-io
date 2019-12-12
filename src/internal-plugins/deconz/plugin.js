"use strict";
const request = require("request");
const DeconzServiceClass = require("./service.js");
const DECONZ_HTTP_PORT = 8053;

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    api.init();

    /**
     * This class manage Deconz form configuration
     * @class
     */
    class DeconzForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id The identifier
         * @param  {boolean} associate The associate flag
         * @param  {string} token The token
         * @returns {DeconzForm}        The instance
         */
        constructor(id, associate, token) {
            super(id);

            /**
             * @Property("associate");
             * @Type("boolean");
             * @Title("deconz.form.associate");
             * @Default(false);
             */
            this.associate = associate;

            /**
             * @Property("token");
             * @Type("string");
             * @Title("deconz.form.token");
             * @Readonly(true);
             */
            this.token = token;
        }


        /**
         * Convert a json object to DeconzForm object
         *
         * @param  {Object} data Some data
         * @returns {DeconzForm}      An instance
         */
        json(data) {
            return new DeconzForm(data.id, data.associate, data.token);
        }
    }

    // Register the hue form
    api.configurationAPI.register(DeconzForm);


    api.installerAPI.register(["arm", "arm64"], "apt-get install lsb", true, true);
    api.installerAPI.register(["arm", "arm64"], "sudo gpasswd -a $USER dialout", true, true);
    api.installerAPI.register(["arm", "arm64"], "wget -O - http://phoscon.de/apt/deconz.pub.key | sudo apt-key add -", true, true);
    api.installerAPI.register(["arm", "arm64"], "sudo sh -c \"echo 'deb http://phoscon.de/apt/deconz $(lsb_release -cs) main' > /etc/apt/sources.list.d/deconz.list\"", true, true);
    api.installerAPI.register(["arm", "arm64"], "apt-get update", true, true);
    api.installerAPI.register(["arm", "arm64"], "apt-get install deconz", true, true);

    /**
     * This class manage Deconz devices
     * @class
     */
    class Deconz extends api.exported.Radio {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The core APIs
         * @returns {Deconz}        The instance
         */
        constructor(api) {
            super(api);
            this.api = api;

            const DeconzService = DeconzServiceClass(api);
            this.service = new DeconzService(this, DECONZ_HTTP_PORT);
            api.servicesManagerAPI.add(this.service);

            api.configurationAPI.setUpdateCb((data) => {
                if (data.associate) {
                    request.post({
                        headers: {"content-type" : "application/x-www-form-urlencoded"},
                        url:     "http://127.0.0.1:" + DECONZ_HTTP_PORT + "/api",
                        body:    "{\"devicetype\":\"hautomation-" + api.environmentAPI.getHautomationId() + "\"}"
                    }, (error, response, body) => {
                        if (error) {
                            api.exported.Logger.err("Could not get token for deconz : " + error.message);
                        } else {
                            api.exported.Logger.info(body);
                            api.configurationAPI.saveData(data);
                        }
                    });
                }
                data.associate = false;

                api.configurationAPI.saveData(data);
            });

        }
    }

    // Instantiate. Parent will store instanciation.
    if (!process.env.TEST) {
        new Deconz(api);
    }
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "deconz",
    version: "0.0.0",
    category: "radio",
    description: "Support zigbee protocol",
    dependencies:["radio"],
    defaultDisabled: true
};
