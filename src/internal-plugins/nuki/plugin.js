"use strict";
const NukiBridgeApi = require("nuki-bridge-api");
const LockActions = NukiBridgeApi.lockAction;

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    api.init();

    /**
     * This class manage Nuki form configuration
     * @class
     */
    class NukiForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id The identifier
         * @param  {string} ip Nuki ip
         * @param  {string} port Nuki port
         * @param  {string} token Nuki token
         * @returns {NukiForm}        The instance
         */
        constructor(id, ip, port, token) {
            super(id);

            /**
             * @Property("ip");
             * @Type("string");
             * @Title("nuki.ip");
             */
            this.ip = ip;

            /**
             * @Property("port");
             * @Type("string");
             * @Title("nuki.port");
             */
            this.port = port;

            /**
             * @Property("token");
             * @Type("string");
             * @Title("nuki.token");
             */
            this.token = token;
        }


        /**
         * Convert a json object to NukiForm object
         *
         * @param  {Object} data Some data
         * @returns {NukiForm}      An instance
         */
        json(data) {
            return new NukiForm(data.id, data.ip, data.port, data.token);
        }
    }

    /**
     * This class provides a form for Nuki actions
     * @class
     */
    class NukiScenarioForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} [id=null]                  An identifier
         * @param  {string} [nukiAction=0]              The Nuki action
         * @returns {NukiScenarioForm} The instance
         */
        constructor(id = null, nukiAction = 0) {
            super(id);

            /**
             * @Property("nukiAction");
             * @Type("string");
             * @Title("nuki.action");
             * @Default("0");
             * @Enum(["0", "1", "2"]);
             * @EnumNames(["nuki.none", "nuki.lock", "nuki.unlock"]);
             */
            this.nukiAction = nukiAction;

        }

        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {NukiScenarioForm}      A form object
         */
        json(data) {
            return new NukiScenarioForm(data.id, data.nukiAction);
        }
    }

    // Register the nuki form
    api.configurationAPI.register(NukiForm);

    /**
     * This class manage Nuki locks
     * @class
     */
    class Nuki {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The core APIs
         * @returns {Nuki}        The instance
         */
        constructor(api) {
            this.api = api;
            this.locked = false;
            this.doorOpened = false;
            this.notificationSent = false;

            api.webAPI.register(this, this.api.webAPI.constants().POST, ":/nuki/", this.api.webAPI.Authentication().AUTH_GUEST_LEVEL);

            const self = this;
            this.api.scenarioAPI.register(NukiScenarioForm, (scenario) => {
                if (scenario && scenario.NukiScenarioForm && scenario.NukiScenarioForm.nukiAction != null && scenario.NukiScenarioForm.nukiAction != "0") {
                    if (scenario.NukiScenarioForm.nukiAction == "1") {
                        self.setNuckiState(true);
                    } else if (scenario.NukiScenarioForm.nukiAction == "2") {
                        self.setNuckiState(false);
                    }
                }
            }, this.api.translateAPI.t("nuki.scenario"));

            this.refreshNukiState();

            this.api.timeEventAPI.register(() => {
                self.refreshNukiState(self);
            }, this, this.api.timeEventAPI.constants().EVERY_MINUTES);
        }

        /**
         * Add tile on dashboard
         */
        addTile() {
            // Credits : Pixel Perfect / https://www.flaticon.com/free-icon/padlock_3596072
            const svgLocked = "<svg id=\"light\" enable-background=\"new 0 0 24 24\" height=\"512\" viewBox=\"0 0 24 24\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><g><path d=\"m12.5 22h-7c-1.379 0-2.5-1.122-2.5-2.5v-17c0-1.378 1.121-2.5 2.5-2.5h11c1.379 0 2.5 1.122 2.5 2.5v8c0 .276-.224.5-.5.5s-.5-.224-.5-.5v-8c0-.827-.673-1.5-1.5-1.5h-11c-.827 0-1.5.673-1.5 1.5v17c0 .827.673 1.5 1.5 1.5h7c.276 0 .5.224.5.5s-.224.5-.5.5z\"/></g><g><path d=\"m22.5 24h-6c-.827 0-1.5-.673-1.5-1.5v-4c0-.827.673-1.5 1.5-1.5h6c.827 0 1.5.673 1.5 1.5v4c0 .827-.673 1.5-1.5 1.5zm-6-6c-.275 0-.5.224-.5.5v4c0 .276.225.5.5.5h6c.275 0 .5-.224.5-.5v-4c0-.276-.225-.5-.5-.5z\"/></g><g><path d=\"m21.5 18h-4c-.276 0-.5-.224-.5-.5v-2c0-1.378 1.121-2.5 2.5-2.5s2.5 1.122 2.5 2.5v2c0 .276-.224.5-.5.5zm-3.5-1h3v-1.5c0-.827-.673-1.5-1.5-1.5s-1.5.673-1.5 1.5z\"/></g><g><path d=\"m6.5 13c-.276 0-.5-.224-.5-.5v-3c0-.276.224-.5.5-.5s.5.224.5.5v3c0 .276-.224.5-.5.5z\"/></g></svg>";
            // Credits : Pixel Perfect / https://www.flaticon.com/free-icon/log-in_3596085
            const svgOpened = "<svg id=\"light\" enable-background=\"new 0 0 24 24\" height=\"512\" viewBox=\"0 0 24 24\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><g><path d=\"m14.5 21h-4c-1.378 0-2.5-1.122-2.5-2.5v-2c0-.276.224-.5.5-.5s.5.224.5.5v2c0 .827.673 1.5 1.5 1.5h4c.276 0 .5.224.5.5s-.224.5-.5.5z\"/></g><g><path d=\"m10.5 11h-10c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h10c.276 0 .5.224.5.5s-.224.5-.5.5z\"/></g><g><path d=\"m16 24c-1.103 0-2-.897-2-2v-18c0-.86.552-1.621 1.373-1.895l6-2c.19-.068.405-.105.627-.105 1.103 0 2 .897 2 2v18c0 .859-.551 1.621-1.372 1.894l-6 2c-.193.069-.408.106-.628.106zm6-23c-.104 0-.208.018-.3.05l-6.011 2.004c-.413.137-.689.517-.689.946v18c0 .551.449 1 1 1 .104 0 .208-.018.302-.051l6.01-2.003c.411-.138.688-.518.688-.946v-18c0-.551-.449-1-1-1z\"/></g><g><path d=\"m8.5 5c-.276 0-.5-.224-.5-.5v-2c0-1.378 1.122-2.5 2.5-2.5h11.5c.276 0 .5.224.5.5s-.224.5-.5.5h-11.5c-.827 0-1.5.673-1.5 1.5v2c0 .276-.224.5-.5.5z\"/></g><g><path d=\"m6.5 15c-.128 0-.256-.049-.354-.146-.195-.195-.195-.512 0-.707l3.647-3.647-3.647-3.646c-.195-.195-.195-.512 0-.707s.512-.195.707 0l4 4c.195.195.195.512 0 .707l-4 4c-.097.097-.225.146-.353.146z\"/></g></svg>";
            const tile = this.api.dashboardAPI.Tile("nuki", this.api.dashboardAPI.TileType().TILE_GENERIC_ACTION_STATUS, (this.locked ? svgLocked : svgOpened), null, (this.doorOpened ? this.api.translateAPI.t("nuki.door.state.opened") : this.api.translateAPI.t("nuki.door.state.closed")), null, null, null, this.locked, 8, "nuki/");
            this.api.dashboardAPI.unregisterTile("nuki");
            this.api.dashboardAPI.registerTile(tile);
        }

        /**
         * Process API callback
         *
         * @returns {Promise}  A promise with an APIResponse object
         */
        processAPI() {
            this.locked = !this.locked;
            this.setNuckiState(this.locked);
            this.addTile();
        }

        /**
         * Refresh Nuki state
         *
         * @param  {Nuki} [context=null] The context. If null, set to this
         */
        refreshNukiState(context = null) {
            if (!context) {
                context = this;
            }
            const conf = context.api.configurationAPI.getConfiguration();
            if (conf.ip && conf.port && conf.token)  {
                const bridge = new NukiBridgeApi.Bridge(conf.ip, parseInt(conf.port), conf.token);
                const self = context;
                bridge.list().then((nukis) => {
                    nukis.forEach((nukiElt) => {
                        if (nukiElt.lastKnownState.state == 2 || nukiElt.lastKnownState.state == 3) {
                            self.locked = false;
                        } else if (nukiElt.lastKnownState.state == 1) {
                            self.locked = true;
                        }

                        if (nukiElt.lastKnownState.doorsensorState == 2) {
                            self.doorOpened = false;
                        } else {
                            self.doorOpened = true;
                        }

                        self.addTile();

                        if (!self.notificationSent && nukiElt.lastKnownState.batteryCritical) {
                            self.notificationSent = true;
                            self.api.messageAPI.sendMessage("*", self.api.translateAPI.t("nuki.battery.low"), null, null, null, true);
                        }

                        /*
                        lastKnownState: {
                        mode: 2,
                        state: 3,
                        stateName: 'unlocked',
                        batteryCritical: false,
                        doorsensorState: 3,
                        doorsensorStateName: 'door opened',
                        doorsensorStateName: 'door closed',
                        timestamp: '2020-09-30T19:07:13+00:00'
                        */
                    });
                }).catch((e) => {
                    context.api.exported.Logger.err(e.message);
                });
            }
        }

        /**
         * Set Nuki state
         *
         * @param  {boolean} lock The desired state
         */
        setNuckiState(lock) {
            const conf = this.api.configurationAPI.getConfiguration();
            if (conf.ip && conf.port && conf.token)  {
                const bridge = new NukiBridgeApi.Bridge(conf.ip, parseInt(conf.port), conf.token);
                bridge.list().then((nukis) => {
                    nukis.forEach((nukiElt) => {
                        const nuki = nukiElt.nuki;
                        if (lock) {
                            nuki.lockAction(LockActions.LOCK);
                        } else {
                            nuki.lockAction(LockActions.UNLOCK);
                        }
                    });
                }).catch((e) => {
                    this.api.exported.Logger.err(e.message);
                });
            }
        }
    }

    new Nuki(api);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "nuki",
    version: "0.0.0",
    category: "locks",
    description: "Nuki",
    defaultDisabled: true,
    dependencies:[]
};
