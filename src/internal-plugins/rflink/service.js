"use strict";

function loaded(api) {
    var Logger;
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
            const sp = require("serialport");
            const readline = require("readline").SerialPort;
            var sclient;

            sclient = new sp("/dev/ttyACM0", {
                baudrate: 57600,
                databits: 8,
                parity: "none",
                stopBits: 1,
                flowControl: false,
                parser: sp.parsers.readline("\n")
            });

            sclient.on("data", function(line) {
                Logger.verbose("Received RFLink data : " + line);
            });

            sclient.on("open", function() {
                Logger.info("RFLink connected, ready to receive data");
            });
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
