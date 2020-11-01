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
            const tile = this.api.dashboardAPI.Tile("nuki", this.api.dashboardAPI.TileType().TILE_GENERIC_ACTION_STATUS, (this.locked ? api.exported.Icons.icons["door-locked"] : api.exported.Icons.icons["door-unlocked"]), null, (this.doorOpened ? this.api.translateAPI.t("nuki.door.state.opened") : (this.locked ? this.api.translateAPI.t("nuki.door.state.locked") : this.api.translateAPI.t("nuki.door.state.closed"))), null, null, null, this.locked, 8, "nuki/");
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
