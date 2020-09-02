"use strict";

const NetgearRouter = require("netgear");

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();


    /**
     * This class manage netgear routers
     * @class
     */
    class Netgear {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The api
         * @returns {Netgear}     The instance
         */
        constructor(api) {
            this.api = api;

            const options = {
                


            };
            const router = new NetgearRouter();
            router.login(options).then((d, e) => {
                console.log(d);
                console.log(e);
            }).catch((e) => {
                console.log(e);
                // process.exit(0);
            });



        }
    }

    api.registerInstance(new Netgear(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "netgear",
    version: "0.0.0",
    category: "misc",
    defaultDisabled: true,
    description: "Netgear routers manager"
};
