/* eslint-disable */
"use strict";

const REBOOT_ACTION = "/reboot/";

function loaded(api) {
    api.init();

    class Reboot {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api        A plugin api
         * @returns {Reboot}              The instance
         */
        constructor(api) {
            this.api = api;
            this.api.webAPI.register(this, api.webAPI.constants().POST, ":" + REBOOT_ACTION, api.webAPI.constants().AUTH_USAGE_LEVEL);
            this.registerTile();
        }

        /**
         * Register a reboot tile
         */
        registerTile() {
            // Register a tile
            const tile = this.api.dashboardAPI.Tile("reboot-master", this.api.dashboardAPI.TileType().TILE_GENERIC_ACTION, this.api.exported.Icons.class.list()["map-pin"], null, "Reboot", null, null, null, 0, 999999, REBOOT_ACTION);
            this.api.dashboardAPI.registerTile(tile);
        }

        /**
         * Process API callback
         *
         * @param  {APIRequest} apiRequest An APIRequest
         * @returns {Promise}  A promise with an APIResponse object
         */
        processAPI(apiRequest) {
            const self = this;
            if (apiRequest.route === ":" + REBOOT_ACTION) {
                return new Promise((resolve, reject) => {
                    setTimeout((me) => {
                        me.api.installerAPI.executeCommand("sudo shutdown -r now");
                    }, 1000, self);
                    resolve(self.api.webAPI.APIResponse(true, {success:true}));
                });
            }
        }
    }

    api.registerInstance(new Reboot(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "reboot",
    version: "0.0.1",
    category: "misc",
    description: "Add a reboot tile on dashboard",
    dependencies:[],
    classes:[]
};
