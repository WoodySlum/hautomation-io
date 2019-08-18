/* eslint-disable */
"use strict";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class should not be implemented but only inherited.
     * This class is used for tv
     * @class
     */
    class Tv {
        /**
         * Constructor
         *
         * @param {PluginAPI} api          The API
         * @param {string} identifier   An identifier
         * @param {Array}  [buttons=[]] An array of buttons. Needed if default buttons not used
         */
        constructor(api, identifier, buttons = []) {
            let defaultButtons = [{standby: ""}, {up: ""}, {down: ""}, {left: ""}, {right: ""}, {enter: ""}, {back: ""}, {home: ""}, {voldown: ""}, {volup: ""}, {mute: ""}, {channelup: ""}, {channeldown: ""}, {source: ""}, {rewind: ""}, {play: ""}, {pause: ""}, {stop: ""}, {record: ""}, {forward: ""}];
            this.buttons = buttons.length  > 0 ? buttons : defaultButtons;
            this.api = api;
            this.identifier = "tv-" + identifier;
            this.update(0, buttons);
        }

        /**
         * Update dashboard tile
         *
         * @param  {int} [status=0]   The TV sattus (on => 1, off => 0)
         */
        update(status = 0) {
            const tile = this.api.dashboardAPI.Tile(this.identifier, this.api.dashboardAPI.TileType().TILE_GENERIC_ACTION_STATUS, this.api.exported.Icons.class.list()["desktop"], null, this.api.translateAPI.t("tv.tile.title"), null, null, null, status, 500, this.identifier, {buttons:this.buttons});
            this.api.dashboardAPI.registerTile(tile);

            this.api.webAPI.register(this, this.api.webAPI.constants().POST, ":/" + this.identifier + "/[set*]/[action*]/", this.api.webAPI.constants().AUTH_USAGE_LEVEL);
        }

        /**
         * Turn on or off TV
         */
        power() {
            api.exported.Logger.err("Method `power` must be overloaded");
        }

        /**
         * Handle button actions
         * @param  {string} name The action name
         */
        action(name) {
            api.exported.Logger.err("Method `action` must be overloaded");
        }

        /**
         * Process API callback
         *
         * @param  {APIRequest} apiRequest An APIRequest
         * @returns {Promise}  A promise with an APIResponse object
         */
        processAPI(apiRequest) {
            const self = this;
            if (apiRequest.route.startsWith(":/" + this.identifier + "/")) {
                return new Promise((resolve, reject) => {
                    if (apiRequest.data && apiRequest.data.action) {
                        self.action(apiRequest.data.action);
                    } else {
                        self.power();
                    }

                    resolve(self.api.webAPI.APIResponse(true, {success:true}));
                });
            }
        }
    }

    api.exportClass(Tv);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "tv",
    version: "0.0.1",
    category: "tv",
    description: "TV base plugin",
    dependencies:[],
    classes:[]
};
