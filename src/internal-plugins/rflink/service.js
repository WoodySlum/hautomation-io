"use strict";

function loaded(api) {
    class RFLinkService extends api.exported.Service.class {
        constructor(plugin) {
            super("rflink", null, api.exported.Service.SERVICE_MODE_THREADED);
            this.plugin = plugin;
        }

        /**
         * Main threaded loop
         *
         * @param  {Object} data    A data passed as initial value
         * @param  {Function} send Send a message to parent process
         */
        run(data, send) {

        }

        /**
         * Retrieve data from process
         * Should be overloaded by service
         *
         * @param  {Object} data    A data passed as initial value
         */
        threadCallback(data) {

        }
    }

    return RFLinkService;
}

module.exports = loaded;
