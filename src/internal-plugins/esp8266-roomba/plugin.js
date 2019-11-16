"use strict";

const request = require("request");
const WS_ESP8266_ROOMBA_BASE_ROUTE = ":/esp8266-roomba/";
const ROOMBA_START = "start";
const ROOMBA_CLEAN = ROOMBA_START;
const ROOMBA_STOP = "stop";
const ROOMBA_SPOT = "spot";
const ROOMBA_DOCK = "dock";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();


    /**
     * This class manage Roomba esp8266
     * @class
     */
    class Esp8266Roomba {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The api
         * @returns {Esp8266Roomba}     The instance
         */
        constructor(api) {
            this.api = api;
            this.api.translateAPI.load();
            const espPlugin = this.api.getPluginInstance("esp8266");
            const wiringSchema = this.api.iotAPI.getWiringSchemaForLib("esp8266");
            wiringSchema.right["D3"].push("Roomba BRC pin");
            wiringSchema.right["RX"].push("Roomba TX pin");
            wiringSchema.right["TX"].push("Roomba RX pin");
            wiringSchema.left["GND-2"].push("mp1584en Out-");
            wiringSchema.left["VIN"].push("mp1584en Out+");
            this.api.iotAPI.registerApp("app", "esp8266-roomba", "Nodemcu Roomba", 5, api.iotAPI.constants().PLATFORMS.ESP8266, api.iotAPI.constants().BOARDS.NODEMCU, api.iotAPI.constants().FRAMEWORKS.ARDUINO, ["esp8266"], espPlugin.generateOptions(espPlugin.constants().MODE_ALWAYS_POWERED, 0), wiringSchema);
            this.api.iotAPI.addIngredientForReceipe("esp8266-roomba", "Roomba iRobot", "500 or 600 Roomba series", 1, true);
            this.api.iotAPI.addIngredientForReceipe("esp8266-roomba", "mp1584en", "Voltage regulator. In+ goes on Roomba Vpwr, In- pin goes on Roomba GND", 1, true);
            this.roombas = {};
            const self = this;
            this.api.coreAPI.registerEvent(espPlugin.constants().PING_EVENT_KEY, (data) => {
                const iot = self.api.iotAPI.getIot(data.id);
                this.roombas[parseInt(data.id)] = Object.assign(iot, data);
                if (iot && iot.iotApp === "esp8266-roomba") { // This is for me
                    self.api.exported.Logger.info("Received new Roomba ping " + iot.name);
                    this.generateTiles(data.id, iot.name);
                }

                this.api.webAPI.register(this, this.api.webAPI.constants().POST, ":/" + data.id + "/[set]/[action]/", this.api.webAPI.Authentication().AUTH_USAGE_LEVEL);
            });

            this.api.webAPI.register(this, this.api.webAPI.constants().POST, WS_ESP8266_ROOMBA_BASE_ROUTE + "[id]/[command]/", this.api.webAPI.Authentication().AUTH_USAGE_LEVEL);
        }

        /**
         * Generate roomba tiles
         *
         * @param  {string} id The roomba id
         * @param  {string} name     The name
         */
        generateTiles(id, name) {
            const buttons = [{stop: ""}, {spot: ""}, {dock: ""}];
            const tile = this.api.dashboardAPI.Tile(id, this.api.dashboardAPI.TileType().TILE_GENERIC_ACTION, api.exported.Icons.class.list()["contrast"], null, this.api.translateAPI.t("esp8266.roomba.start", name), null, null, null, 0, 23, "esp8266-roomba/" + id + "/start/", {buttons: buttons});
            this.api.dashboardAPI.registerTile(tile);
        }

        /**
         * Process a roomba command
         *
         * @param  {string} id The roomba id
         * @param  {string} command     The command
         * @param  {Function} resolve     The promise's resolve function
         * @param  {Function} reject     The promise's reject function
         */
        processRoombaCommand(id, command, resolve, reject) {
            const roomba = this.roombas[parseInt(id)];
            if (roomba) {
                if (command == ROOMBA_START || command == ROOMBA_CLEAN ||command == ROOMBA_STOP ||command == ROOMBA_SPOT ||command == ROOMBA_DOCK) {
                    request("http://" + roomba.ip + "/" + command, { }, (err) => {
                        if (err) {
                            reject(this.api.webAPI.APIResponse(false, {}, 7142042425, err.message));
                        } else {
                            resolve(this.api.webAPI.APIResponse(true, {success:true}));
                        }
                    });
                } else {
                    reject(this.api.webAPI.APIResponse(false, {}, 7142042428, "Invalid command"));
                }
            } else {
                reject(this.api.webAPI.APIResponse(false, {}, 7142042424, "No roomba found"));
            }
        }

        /**
         * Process API callback
         *
         * @param  {[type]} apiRequest An APIRequest
         * @returns {Promise}  A promise with an APIResponse object
         */
        processAPI(apiRequest) {
            const self = this;
            if (apiRequest.route.startsWith(WS_ESP8266_ROOMBA_BASE_ROUTE)) {
                return new Promise((resolve, reject) => {
                    self.processRoombaCommand(apiRequest.data.id, apiRequest.data.command, resolve, reject);
                    resolve(this.api.webAPI.APIResponse(true, {success:true}));
                });
            } else {
                return new Promise((resolve, reject) => {
                    self.processRoombaCommand(apiRequest.action, apiRequest.data.action, resolve, reject);
                });
            }
        }
    }

    new Esp8266Roomba(api);

}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "esp8266-roomba",
    version: "0.0.0",
    category: "iot",
    description: "Connect Roomba 500 or 600 series",
    dependencies:["esp8266"]
};
