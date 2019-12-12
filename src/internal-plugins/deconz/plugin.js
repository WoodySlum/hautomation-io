"use strict";
const DeconzServiceClass = require("./service.js");
const DECONZ_HTTP_PORT = 8053;

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    api.init();
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
