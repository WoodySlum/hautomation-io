"use strict";

const fs = require("fs-extra");

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    /**
     * This class conect to RFLink using serial port on a pseicif thread.
     * @class
     */
    class SocatService extends api.exported.Service.class {
        /**
         * Constructor
         *
         * @param  {RFLink} plugin The RFLink plugin
         * @param  {string} ip       The ser2net ip
         * @param  {int} port     The ser2net iport
         * @param  {string} endpoint The ser2net endpoint, as set in service
         * @returns {SocatService}          The socat service
         */
        constructor(plugin, ip, port, endpoint) {
            //socat pty,link=/Users/smizrahi/dev/ttyV0 tcp:192.168.0.36:9999,forever,interval=10,fork
            fs.ensureFileSync(endpoint);
            fs.writeFileSync(endpoint, " ");
            super("rflink-socat", null, api.exported.Service.SERVICE_MODE_EXTERNAL, "socat pty,link=" + endpoint + " tcp:" + ip + ":" + port + ",forever,interval=10,fork");
            this.plugin = plugin;
        }

    }

    return SocatService;
}

module.exports = loaded;
