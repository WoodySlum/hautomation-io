"use strict";

var self = null;

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    var Logger;
    /**
     * This class conect to RFLink using serial port on a pseicif thread.
     * @class
     */
    class RFLinkService extends api.exported.Service.class {
        /**
         * Constructor
         *
         * @param  {RFLink} plugin The RFLink plugin
         * @returns {RFLinkService}        The instance
         */
        constructor(plugin) {
            super("rflink", null, api.exported.Service.SERVICE_MODE_THREADED);
            this.plugin = plugin;
            self = this;
        }

        /**
         * Main threaded loop
         *
         * @param  {Object} data    A data passed as initial value
         * @param  {Function} send Send a message to parent process
         */
        run(data, send) {
            const sp = require("serialport");
            //const readline = require("readline").SerialPort;
            var sclient;

            let processData = (telegram) => {
                var elements = telegram.split(";");
                if (elements.length >= 3) {
                    const rflinkId = elements[0].toLowerCase();
                    const commandId = elements[1].toLowerCase();
                    const protocol = elements[2].toLowerCase();

                    if (protocol.indexOf("=") !== -1) {
                        return null;
                    }

                    let deviceId = null;
                    let switchId = null;
                    let sensor = null;
                    let status = null;
                    let value = null;

                    if (elements.length >= 4) {
                        if (elements[3].indexOf("ID=") !== -1) {
                            deviceId = elements[3].split("=")[1].toLowerCase();
                        }
                    }

                    if (elements.length >= 5) {
                        if (elements[4].indexOf("SWITCH=") !== -1) {
                            switchId = elements[4].split("=")[1].toLowerCase();
                        }

                        if (elements[4].indexOf("TEMP=") !== -1) {
                            sensor = "TEMP";
                            value = parseInt(elements[4].split("=")[1]);
                        }

                        if (elements[4].indexOf("HUM=") !== -1) {
                            sensor = "HUM";
                            value = parseInt(elements[4].split("=")[1]);
                        }

                        if (elements[4].indexOf("UV=") !== -1) {
                            sensor = "UV";
                            value = parseInt(elements[4].split("=")[1]);
                        }
                    }

                    if (elements.length >= 6) {
                        if (elements[5].indexOf("CMD=") !== -1) {
                            status = elements[5].split("=")[1];
                        }
                    }

                    return {
                        rflink_id: rflinkId,
                        sensor_id: commandId,
                        protocol: protocol,
                        code: deviceId,
                        subcode: switchId,
                        status: status,
                        value: value,
                        sensor: sensor,
                        timestamp: Math.floor((Date.now() / 1000) | 0),
                        raw: telegram
                    };
                } else {
                    Logger.warn("Invalid number of lines in telegram (" + telegram.length + ")");
                    return null;
                }
            };

            try {
                sclient = new sp("/dev/ttyACM0", {
                    baudrate: 9600,
                    databits: 8,
                    parity: "none",
                    stopBits: 1,
                    flowControl: false,
                    parser: sp.parsers.readline("\r\n")
                });

                sclient.on("data", function(line) {
                    Logger.info("RFLink data received : " + line);
                    const d = processData(line);
                    if (d) {
                        send(d);
                    }
                });

                sclient.on("open", function() {
                    Logger.info("RFLink connected, ready to receive data");
                });

                sclient.on("close", function() {
                    Logger.info("RFLink connection closed");
                });

                sclient.on("error", function(err) {
                    Logger.err("RFLink error : ");
                    Logger.err(err.message);
                });
            } catch(e) {
                Logger.err(e.message);
            }

            this.rflinkSend = (data) => {
                Logger.info("RFLink sending data : " + data);
                sclient.write(data + "\r\n");
            };

            // Logger.warn(JSON.stringify(processData("20;01;Blyss;ID=6968;SWITCH=C4;CMD=ON;")));

            /*setTimeout(() => {
                send(processData("20;01;Blyss;ID=6968;SWITCH=C4;CMD=ON;"));
            }, 3000);

            setTimeout(() => {
                send(processData("20;01;Blyss;ID=6968;SWITCH=C4;CMD=ON;"));
            }, 30000);
            setTimeout(() => {
                send(processData("20;01;Blyss;ID=6968;SWITCH=C4;CMD=ON;"));
            }, 70000);*/
            //send(processData("20;03;Cresta;ID=8301;WINDIR=0005;WINSP=0000;WINGS=0000;WINTMP=00c3;WINCHL=00c3;BAT=LOW;"));
            //send(processData("06;CMD=ON;"));
            //Logger.warn(JSON.stringify(processData("20;03;Cresta;ID=8301;WINDIR=0005;WINSP=0000;WINGS=0000;WINTMP=00c3;WINCHL=00c3;BAT=LOW;")));
            // 20;00;Nodo RadioFrequencyLink - RFLink Gateway V1.1 - R46;
            // 20;01;Blyss;ID=6968;SWITCH=C4;CMD=ON;
            // 20;02;Blyss;ID=6968;SWITCH=C4;CMD=OFF;
        }

        /**
         * Retrieve data from process
         * Should be overloaded by service
         *
         * @param  {Object} data    A data passed as initial value
         */
        threadCallback(data) {
            self.plugin.onRflinkReceive(data);
        }
    }

    return RFLinkService;
}

module.exports = loaded;
