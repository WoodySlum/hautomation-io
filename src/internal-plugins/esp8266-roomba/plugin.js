"use strict";

const request = require("request");
const fs = require("fs-extra");
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
     * This class provides a form for roomba actions
     * @class
     */
    class RoombaScenarioForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} [id=null]                  An identifier
         * @param  {string} [roomba=null]              The roomba identifier
         * @param  {string} [command=null]              The command
         * @returns {RoombaScenarioForm} The instance
         */
        constructor(id = null, roomba = null, command = null) {
            super(id);

            /**
             * @Property("roomba");
             * @Title("esp8266.roomba.scenario.roomba");
             * @Type("string");
             * @Enum("getRoombaIds");
             * @EnumNames("getRoombaNames");
             */
            this.roomba = roomba;

            /**
             * @Property("command");
             * @Title("esp8266.roomba.scenario.command");
             * @Type("string");
             * @Enum("getRoombaCommandIds");
             * @EnumNames("getRoombaCommandNames");
             * @Display("radio");
             */
            this.command = command;
        }

        /**
         * Form injection method for roomba id
         *
         * @param  {...Object} inject The hue list array
         * @returns {Array}        An array of hue ids
         */
        static getRoombaIds(...inject) {
            return inject[0];
        }

        /**
         * Form injection method for roomba names
         *
         * @param  {...Object} inject The hue list array
         * @returns {Array}        An array of hue ids
         */
        static getRoombaNames(...inject) {
            return inject[1];
        }

        /**
         * Form injection method for roomba command id
         *
         * @param  {...Object} inject The hue list array
         * @returns {Array}        An array of hue ids
         */
        static getRoombaCommandIds(...inject) {
            return inject[2];
        }

        /**
         * Form injection method for roomba command names
         *
         * @param  {...Object} inject The hue list array
         * @returns {Array}        An array of hue ids
         */
        static getRoombaCommandNames(...inject) {
            return inject[3];
        }

        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {RoombaScenarioForm}      A form object
         */
        json(data) {
            return new RoombaScenarioForm(data.id, data.roomba, data.command);
        }
    }


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
                if (iot && iot.iotApp === "esp8266-roomba") { // This is for me
                    this.roombas[parseInt(data.id)] = Object.assign(iot, data);
                    self.api.exported.Logger.info("Received new Roomba ping " + iot.name);
                    this.generateTiles(data.id, iot.name);
                    this.registerScenarioForm();
                }

                this.api.webAPI.register(this, this.api.webAPI.constants().POST, ":/" + data.id + "/[set]/[action]/", this.api.webAPI.Authentication().AUTH_USAGE_LEVEL);
            });

            this.api.webAPI.register(this, this.api.webAPI.constants().POST, WS_ESP8266_ROOMBA_BASE_ROUTE + "[id]/[command]/", this.api.webAPI.Authentication().AUTH_USAGE_LEVEL);
        }

        /**
         * Get rommba id list
         *
         * @returns {Array}     The roomba id list
         */
        getRoombaIds() {
            return Object.keys(this.roombas);
        }

        /**
         * Get rommba name list
         *
         * @returns {Array}     The roomba name list
         */
        getRoombaNames() {
            const names = [];
            Object.keys(this.roombas).forEach((key) => {
                names.push(this.roombas[key].name);
            });

            return names;
        }

        /**
         * Get command id list
         *
         * @returns {Array}     The command id list
         */
        getRoombaCommandIds() {
            return [ROOMBA_CLEAN, ROOMBA_STOP, ROOMBA_SPOT, ROOMBA_DOCK];
        }

        /**
         * Get command name list
         *
         * @returns {Array}     The command name list
         */
        getRoombaCommandNames() {
            return [this.api.translateAPI.t("esp8266.roomba.clean"), this.api.translateAPI.t("esp8266.roomba.stop"), this.api.translateAPI.t("esp8266.roomba.spot"), this.api.translateAPI.t("esp8266.roomba.dock")];
        }

        /**
         * Generate roomba tiles
         *
         * @param  {string} id The roomba id
         * @param  {string} name     The name
         */
        generateTiles(id, name) {
            const buttons = [{stop: ""}, {spot: ""}, {dock: ""}];
            // Credits : Creaticca Creative Agency / https://www.flaticon.com/free-icon/cleaner_445961
            let background = fs.readFileSync("./res/tiles/roomba.jpg").toString("base64");
            const roombaSvg = "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"	 viewBox=\"0 0 512.637 512.637\" style=\"enable-background:new 0 0 512.637 512.637;\" xml:space=\"preserve\"><g>	<g>		<path d=\"M508.265,395.66c-4.147-2.356-9.42-0.905-11.776,3.243c-20.181,37.246-48.646,69.36-83.2,93.867			c-2.306,1.609-3.671,4.251-3.649,7.063c0.036,4.713,3.886,8.504,8.599,8.468c1.623-0.071,3.192-0.604,4.523-1.536			c36.794-25.881,67.156-59.863,88.747-99.328C513.864,403.289,512.412,398.016,508.265,395.66z\"/>	</g></g><g>	<g>		<path d=\"M480.916,372.663c-4.218-2.121-9.357-0.421-11.477,3.797c-20.18,40.335-51.285,74.19-89.771,97.707			c-2.076,1.492-3.373,3.835-3.536,6.386c-0.3,4.703,3.27,8.759,7.973,9.059c1.569-0.011,3.104-0.454,4.437-1.28			c41.166-25.059,74.483-61.155,96.171-104.192C486.834,379.922,485.134,374.783,480.916,372.663z\"/>	</g></g><g>	<g>		<path d=\"M99.348,492.769c-34.554-24.506-63.019-56.62-83.2-93.867c-2.356-4.147-7.629-5.599-11.776-3.243			c-4.147,2.356-5.599,7.629-3.243,11.776c21.346,39.374,51.41,73.349,87.893,99.328c1.451,1.013,3.18,1.549,4.949,1.536			c2.975,0.18,5.829-1.206,7.527-3.656C104.184,500.771,103.221,495.454,99.348,492.769z\"/>	</g></g><g>	<g>		<path d=\"M132.542,474.167c-38.486-23.516-69.591-57.371-89.771-97.707c-2.121-4.218-7.259-5.918-11.477-3.797			s-5.918,7.259-3.797,11.477c21.688,43.037,55.005,79.133,96.171,104.192c1.333,0.826,2.869,1.269,4.437,1.28			c2.551-0.163,4.895-1.46,6.386-3.536C137.242,482.249,136.369,476.917,132.542,474.167z\"/>	</g></g><g>	<g>		<path d=\"M256.105,4.321c-141.385,0-256,114.615-256,256c-0.141,4.6,1.583,9.062,4.779,12.373c3.22,3.331,7.655,5.21,12.288,5.205			h17.067c4.588,119.189,102.59,213.422,221.867,213.333c119.366,0.31,217.497-94.047,221.867-213.333h17.067			c4.645-0.018,9.083-1.928,12.288-5.291c3.175-3.29,4.896-7.717,4.779-12.288C512.105,118.936,397.49,4.321,256.105,4.321z			 M477.972,260.833c-9.229-0.004-16.79,7.33-17.067,16.555c-3.839,91.123-67.237,168.833-155.733,190.891			c-32.244,7.822-65.89,7.822-98.133,0c-88.497-22.058-151.894-99.767-155.733-190.891c-0.277-9.225-7.837-16.559-17.067-16.555			H17.172C17.172,128.874,124.146,21.9,256.105,21.9s238.933,106.974,238.933,238.933H477.972z\"/>	</g></g><g>	<g>		<path d=\"M315.838,474.167c0-32.99-26.744-59.733-59.733-59.733s-59.733,26.744-59.733,59.733c-0.032,1.11-0.004,2.221,0.085,3.328			c0.403,3.567,2.995,6.5,6.485,7.339c17.401,4.251,35.25,6.4,53.163,6.4c17.942,0.007,35.819-2.142,53.248-6.4			c3.49-0.839,6.082-3.772,6.485-7.339C315.899,476.386,315.899,475.275,315.838,474.167z M213.438,469.815			c2.027-20.194,17.998-36.165,38.192-38.192c23.446-2.353,44.361,14.746,46.715,38.192			C270.344,475.651,241.44,475.651,213.438,469.815z\"/>	</g></g><g>	<g>		<path d=\"M457.833,177.121l-1.195-2.645c-21.94-46.348-59.258-83.666-105.606-105.606			C240.281,16.443,107.999,63.724,55.572,174.476l-1.195,2.56c-0.996,2.216-1.507,4.618-1.5,7.047			c0.028,9.426,7.691,17.044,17.116,17.017h19.029c6.377-0.035,12.202-3.622,15.104-9.301			c16.351-32.045,42.409-58.104,74.454-74.454c83.959-42.839,186.749-9.505,229.588,74.454c2.901,5.679,8.727,9.266,15.104,9.301			h18.944c2.385,0.002,4.743-0.497,6.924-1.462C457.759,195.82,461.65,185.739,457.833,177.121z M423.358,184.033			c-17.971-35.164-46.572-63.765-81.736-81.736c-92.324-47.183-205.417-10.589-252.6,81.736H69.908l1.109-2.389			c34.121-71.307,106.039-116.798,185.088-117.077c79.036,0.243,150.958,45.704,185.088,116.992l1.109,2.475H423.358z\"/>	</g></g><g>	<g>		<path d=\"M371.817,214.497c-12.653-26.701-34.154-48.202-60.855-60.855c-63.882-30.273-140.211-3.027-170.484,60.855			c-8.194,17.128-12.423,35.882-12.373,54.869c0,3.157,0,6.229,0,9.045c0.982,12.591,3.859,24.961,8.533,36.693			c6.57,17.157,16.756,32.698,29.867,45.568c3.302,3.289,6.807,6.368,10.496,9.216c3.763,3.062,7.694,5.911,11.776,8.533			l3.243,1.877c19.465,11.285,41.586,17.176,64.085,17.067c22.27,0.144,44.179-5.628,63.488-16.725			c1.28-0.597,2.56-1.365,3.669-2.048c4.084-2.619,8.016-5.468,11.776-8.533c3.689-2.848,7.194-5.927,10.496-9.216			c13.192-12.903,23.439-28.505,30.037-45.739c4.657-11.649,7.533-23.932,8.533-36.437c0-3.072,0-6.144,0-9.301			C384.181,250.386,379.981,231.632,371.817,214.497z M367.038,277.388c-0.931,10.846-3.492,21.49-7.595,31.573			c-5.737,14.957-14.645,28.494-26.112,39.68c-2.816,2.805-5.809,5.427-8.96,7.851c-3.449,2.56-7.038,4.925-10.752,7.083			l-2.731,1.536c-34.36,19.677-76.573,19.677-110.933,0l-2.304-1.365c-3.599-2.227-7.075-4.648-10.411-7.253			c-3.151-2.423-6.144-5.045-8.96-7.851c-11.457-11.161-20.364-24.668-26.112-39.595c-3.924-10.226-6.283-20.985-6.997-31.915			c0-2.56,0-5.12,0-7.765c-0.062-16.444,3.584-32.69,10.667-47.531c18.479-38.631,57.444-63.27,100.267-63.403			c42.823,0.133,81.788,24.772,100.267,63.403c7.083,14.841,10.729,31.087,10.667,47.531			C367.038,272.012,367.038,274.572,367.038,277.388z\"/>	</g></g><g>	<g>		<path d=\"M256.105,448.567c-4.713,0-8.533,3.821-8.533,8.533v25.6c0,4.713,3.82,8.533,8.533,8.533c4.713,0,8.533-3.82,8.533-8.533			v-25.6C264.638,452.387,260.818,448.567,256.105,448.567z\"/>	</g></g><g>	<g>		<path d=\"M310.121,243.767c-5.912-12.523-15.992-22.602-28.514-28.514c-29.832-14.084-65.434-1.318-79.518,28.514			c-3.821,7.99-5.776,16.744-5.717,25.6c-0.02,16.258,6.645,31.81,18.432,43.008c1.368,1.37,2.822,2.653,4.352,3.84			c1.669,1.315,3.406,2.54,5.205,3.669l2.304,1.28c8.919,5.25,19.091,7.992,29.44,7.936c10.305,0.096,20.445-2.586,29.355-7.765			l2.816-1.621c1.707-1.109,3.243-2.219,5.035-3.584c1.627-1.259,3.167-2.627,4.608-4.096			C316.131,294.21,321.031,266.795,310.121,243.767z M285.886,299.745c-0.962,0.977-1.989,1.89-3.072,2.731l-3.413,2.475			l-2.475,1.451c-12.925,7.402-28.803,7.402-41.728,0l-1.963-1.109c-1.365-0.853-2.389-1.621-3.499-2.475			c-1.02-0.761-1.989-1.588-2.901-2.475c-8.533-8.045-13.378-19.248-13.397-30.976c-0.042-6.255,1.329-12.439,4.011-18.091			c7.023-15.001,22.093-24.582,38.656-24.576c16.401,0.095,31.295,9.582,38.315,24.405			C302.2,267.485,298.778,286.993,285.886,299.745z\"/>	</g></g><g>	<g>		<path d=\"M256.105,243.767c-4.713,0-8.533,3.82-8.533,8.533v34.133c0,4.713,3.82,8.533,8.533,8.533c4.713,0,8.533-3.82,8.533-8.533			V252.3C264.638,247.587,260.818,243.767,256.105,243.767z\"/>	</g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>";
            const tile = this.api.dashboardAPI.Tile(id, this.api.dashboardAPI.TileType().TILE_GENERIC_ACTION_DARK, roombaSvg, null, this.api.translateAPI.t("esp8266.roomba.tile.start", name), null, background, null, 0, 23, "esp8266-roomba/" + id + "/start/", {buttons: buttons});
            this.api.dashboardAPI.registerTile(tile);
        }

        /**
         * Register scenario form
         */
        registerScenarioForm() {
            this.api.scenarioAPI.registerWithInjection(RoombaScenarioForm, (scenario) => {
                if (scenario && scenario.RoombaScenarioForm && scenario.RoombaScenarioForm.length > 0) {
                    scenario.RoombaScenarioForm.forEach((roombaScenarioForm) => {
                        const self = this;
                        const action = new Promise((resolve, reject) => {
                            self.processRoombaCommand(roombaScenarioForm.roomba, roombaScenarioForm.command, resolve, reject);
                        });
                        action.then().catch((e) => {
                            this.api.exported.Logger.err(e);
                        });
                    });
                }
            }, this.api.translateAPI.t("esp8266.roomba.scenario.title"), null, true, this.getRoombaIds(), this.getRoombaNames(), this.getRoombaCommandIds(), this.getRoombaCommandNames());
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
                    this.api.exported.Logger.info("Trigger " + "http://" + roomba.ip + "/" + command);
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
