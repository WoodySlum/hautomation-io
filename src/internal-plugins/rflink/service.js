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
                let sendRadioArray = [];
                var rflink_id,
                    sensor_id,
                    name_id,
                    device_id,
                    rfdata = {},
                    result,
                    idx,
                    name,
                    value;

                if(telegram.length > 0) {
                    var tg = telegram.split(";");

                    rfdata.timestamp = Math.round(new Date().getTime()/1000).toString();
                    // Process RFLink
                    rflink_id = tg[0];
                    sensor_id = tg[1];
                    name_id = (tg[2].toLowerCase().replace(/ /g,"_")).replace(/\//g,"_"); //lowercase, replace spaces and slashes

                    device_id = tg[3].split("=")[1];

                    if (name_id.includes("nodo_radiofrequencylink") )
                    {
                        Logger.info("Start message, getting RFLink version...");

                    }

                    if (name_id.includes("ver") ) // 20;3C;VER=1.1;REV=37;BUILD=01;
                    {
                        // version info
                        const vers = tg[2].split("=")[1];
                        const rev = tg[3].split("=")[1];
                    }

                    for(var i = 4; i < (tg.length)-1;i++)
                    {
                        // we don"t use split() method since values can have "=" in it
                        idx = tg[i].indexOf("=");
                        name = (tg[i].substring(0, idx)).toLowerCase();
                        value = tg[i].substring(idx + 1, tg[i].length);
                        rfdata[ name ] = value;
                    }
                    //log(rfdata);

                    for(var y in rfdata)
                    {
                        if (y === "switch")
                        {
                            result = rfdata[y];
                            rfdata[y] = result.toString();
                        }
                        else if (y === "cmd") // ON/OFF/ALLON/ALLOFF
                        {
                            result = rfdata[y];
                        }
                        else if (y === "set_level") // 1-100 %
                        {
                            result = Math.round(parseInt(rfdata[y]) * 99 / 15) + 1    ;
                            rfdata[y] = result.toString();
                        }
                        else if (y === "temp") // celcius
                        {
                            result = parseInt(rfdata[y], 16);
                            if(result >= 32768){
                                result = 32768 - result;
                            }

                            rfdata[y] = (result / 10.0).toString();
                        }
                        else if (y === "hum") // 0-100 %
                        {
                            result = parseInt(rfdata[y]);
                            rfdata[y] = result.toString();
                        }
                        else if (y === "baro")
                        {
                            result = parseInt(rfdata[y], 16);
                            rfdata[y] = result.toString();
                        }
                        else if (y === "hstatus") // 0=Normal, 1=Comfortable, 2=Dry, 3=Wet
                        {
                            result = parseInt(rfdata[y]);
                            rfdata[y] = result.toString();
                        }
                        else if (y === "bforecast") // 0=No Info/Unknown, 1=Sunny, 2=Partly Cloudy, 3=Cloudy, 4=Rain
                        {
                            result = parseInt(rfdata[y]);
                            rfdata[y] = result.toString();
                        }
                        else if (y === "uv")
                        {
                            result = parseInt(rfdata[y], 16) /10.0;
                            rfdata[y] = result.toString();
                        }
                        else if (y === "lux")
                        {
                            result = parseInt(rfdata[y], 16);
                            rfdata[y] = result.toString();
                        }
                        else if (y === "bat") // OK/LOW
                        {
                            result = rfdata[y];
                            rfdata[y] = result.toString();
                        }
                        else if (y === "rain") // mm
                        {
                            result = parseInt(rfdata[y], 16) /10.0;
                            rfdata[y] = result.toString();
                        }
                        else if (y === "raintot") // mm
                        {
                            result = parseInt(rfdata[y], 16);
                            rfdata[y] = result.toString();
                        }
                        else if (y === "winsp") // km. p/h
                        {
                            result = parseInt(rfdata[y], 16) /10.0;
                            rfdata[y] = result.toString();
                        }
                        else if (y === "awinsp") // km. p/h
                        {
                            result = parseInt(rfdata[y], 16) /10.0;
                            rfdata[y] = result.toString();
                        }
                        else if (y === "wings") // km. p/h
                        {
                            result = parseInt(rfdata[y], 16);
                            rfdata[y] = result.toString();
                        }
                        else if (y === "windir") // 0-360 degrees in 22.5 degree steps
                        {
                            result = parseInt(rfdata[y]) *22.5;
                            rfdata[y] = result.toString();
                        }
                        else if (y === "winchl")
                        {
                            result = parseInt(rfdata[y], 16);
                            if(result >= 32768){
                                result = 32768 - result;
                            }

                            rfdata[y] = (result / 10.0).toString();
                        }
                        else if (y === "wintmp")
                        {
                            result = parseInt(rfdata[y], 16);
                            if(result >= 32768){
                                result = 32768 - result;
                            }

                            rfdata[y] = (result / 10.0).toString();
                        }
                        else if (y === "chime")
                        {
                            result = parseInt(rfdata[y]);
                            rfdata[y] = result.toString();
                        }
                        else if (y === "smokealert") // ON/OFF
                        {
                            result = rfdata[y];
                            rfdata[y] = result.toString();
                        }
                        else if (y === "pir") // ON/OFF
                        {
                            result = rfdata[y];
                            rfdata[y] = result.toString();
                        }
                        else if (y === "co2")
                        {
                            result = parseInt(rfdata[y]);
                            rfdata[y] = result.toString();
                        }
                        else if (y === "sound")
                        {
                            result = parseInt(rfdata[y]);
                            rfdata[y] = result.toString();
                        }
                        else if (y === "kwatt")
                        {
                            result = parseInt(rfdata[y]);
                            rfdata[y] = result.toString();
                        }
                        else if (y === "watt")
                        {
                            result = parseInt(rfdata[y]);
                            rfdata[y] = result.toString();
                        }
                        else if (y === "dist")
                        {
                            result = parseInt(rfdata[y]);
                            rfdata[y] = result.toString();
                        }
                        else if (y === "meter")
                        {
                            result = parseInt(rfdata[y]);
                            rfdata[y] = result.toString();
                        }
                        else if (y === "volt")
                        {
                            result = parseInt(rfdata[y]);
                            rfdata[y] = result.toString();
                        }
                        else if (y === "current")
                        {
                            result = parseInt(rfdata[y]);
                            rfdata[y] = result.toString();
                        }
                    }

                    //log(rfdata);

                    //only accept RFLink->Master messages

                    if (rflink_id == 20)
                    {
                        if (name_id.includes("nodo_radiofrequencylink"))
                        {
                            // version info
                            Logger.info("Received: Start message");
                        }
                        else if (name_id.includes("ver"))
                        {
                            // version info
                            // 20;15;VER=1.1;REV=42;BUILD=0a;
                            Logger.info("Received: Version info");
                        }
                        else if (name_id.includes("ok"))
                        {
                            // message received
                            Logger.info("Received: ok message");
                            sendRadioArray.shift();
                            Logger.info("Removed item. Radio array length : "+sendRadioArray.length);
                            if (sendRadioArray.length > 0) {
                                return sendRadioArray[0];
                            } else {
                                Logger.info("Removed item. Nothing to do.");
                            }
                        }
                        else if (name_id.includes("pong"))
                        {
                            // ping received
                            Logger.info("Received: pong");
                        }
                        else if (name_id.includes("cmd_unkknown"))
                        {
                            // unkknown command received
                            Logger.info("Received: Unkknown command");
                            Logger.info("Received: ok message");
                            sendRadioArray.shift();
                            Logger.info("Removed item. Radio array length : "+sendRadioArray.length);
                            if (sendRadioArray.length > 0) {
                                return sendRadioArray[0];
                            } else {
                                Logger.info("Removed item. Nothing to do.");
                            }
                        }
                        else
                        {
                            return {
                                rflink_id: rflink_id,
                                sensor_id: sensor_id,
                                protocol: name_id,
                                code: device_id,
                                subcode: rfdata.switch,
                                status: rfdata.cmd,
                                timestamp: rfdata.timestamp,
                                raw: telegram,
                                rfdata: rfdata
                            };
                        }
                    }

                } else {
                    Logger.warn("Invalid number of lines in telegram (" + telegram.length + ")");
                }
            };

            try {
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
            } catch(e) {
                Logger.err(e.message);
            }

            this.rflinkSend = (data) => {
                sclient.write(data + "\r\n");
            };

            // Logger.warn(JSON.stringify(processData("20;01;Blyss;ID=6968;SWITCH=C4;CMD=ON;")));
            send(processData("20;01;Blyss;ID=6968;SWITCH=C4;CMD=ON;"));
            //send(processData("20;03;Cresta;ID=8301;WINDIR=0005;WINSP=0000;WINGS=0000;WINTMP=00c3;WINCHL=00c3;BAT=LOW;"));
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
