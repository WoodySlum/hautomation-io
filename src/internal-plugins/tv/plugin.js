/* eslint-disable */
"use strict";

const DEFAULT_ACTION_TIMER = 0.4; // In seconds

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class provides a scenario form actions for tv
     * @class
     */
    class TvActionsScenarioForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} [id=null]                  An identifier
         * @param  {string} [action=null]  An action
         * @param  {number} [timer=null]  A timer
         * @returns {TvActionsScenarioForm}                            The instance
         */
        constructor(id = null, action = null, timer = 0.3) {
            super(id);

            /**
             * @Property("action");
             * @Title("tv.scenario.action");
             * @Type("string");
             * @Enum("getActions");
             * @EnumNames("getActions");
             */
            this.action = action;


            /**
             * @Property("timer");
             * @Title("tv.scenario.timer");
             * @Type("number");
             * @Default(0.4);
             * @Range([0.4, 10, 0.2]);
             */
            this.timer = timer;
        }

        /**
         * Get the actions
         *
         * @param  {...Array} inject Injection
         * @returns {Array}        The actions
         */
        static getActions(...inject) {
            return inject[0];
        }

        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {TvActionsScenarioForm}      A form object
         */
        json(data) {
            return new TvActionsScenarioForm(data.id, data.action, data.timer);
        }
    }

    /**
     * This class provides a scenario form for tv
     * @class
     */
    class TvScenarioForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} [id=null]                  An identifier
         * @param  {string} [plugin=null]  A plugin
         * @returns {TvScenarioForm}                            The instance
         */
        constructor(id = null, plugin = null, actions = null) {
            super(id);

            /**
             * @Property("plugin");
             * @Title("tv.scenario.plugin");
             * @Type("string");
             * @Enum("getPlugins");
             * @EnumNames("getPlugins");
             */
            this.plugin = plugin;

            /**
             * @Property("actions");
             * @Type("objects");
             * @Cl("TvActionsScenarioForm");
             */
            this.actions = actions;
        }

        /**
         * Get the plugins
         *
         * @param  {...Array} inject Injection
         * @returns {Array}        The plugins
         */
        static getPlugins(...inject) {
            return inject[0];
        }

        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {TvScenarioForm}      A form object
         */
        json(data) {
            return new TvScenarioForm(data.id, data.plugin, data.actions);
        }
    }

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
         * @param {string} [tileTitle=null] A title for dashboard tile
         * @param {Array}  [buttons=[]] An array of buttons. Needed if default buttons not used
         */
        constructor(api, tileTitle = null, buttons = []) {
            this.api = api;
            this.tileTitle = tileTitle ? tileTitle : this.api.translateAPI.t("tv.tile.title");
            let defaultButtons = [{back: ""}, {up: "", theme: this.api.themeAPI.constants().SECONDARY_COLOR_KEY}, {standby: "", theme: this.api.themeAPI.constants().OFF_COLOR_KEY}, {left: "", theme: this.api.themeAPI.constants().SECONDARY_COLOR_KEY}, {enter: "", theme: this.api.themeAPI.constants().ON_COLOR_KEY}, {right: "", theme: this.api.themeAPI.constants().SECONDARY_COLOR_KEY}, {channeldown: ""}, {down: "", theme: this.api.themeAPI.constants().SECONDARY_COLOR_KEY}, {channelup: ""}, {voldown: ""}, {volup: ""}, {mute: ""}, {rewind: ""}, {play: ""}, {forward: ""}, {stop: ""}, {record: ""}, {home: ""}, {source: ""}];
            this.buttons = buttons.length  > 0 ? buttons : defaultButtons;
            this.identifier = this.api.getIdentifier();
            this.update(0, buttons);
            this.api.webAPI.register(this, this.api.webAPI.constants().POST, ":/" + this.identifier + "/[set*]/[action*]/", api.webAPI.Authentication().AUTH_GUEST_LEVEL);
            const buttonsActions = [];
            this.buttons.forEach((button) => {
                const buttonKeys = Object.keys(button);
                if (buttonKeys.length >= 1) {
                    buttonsActions.push(buttonKeys[0]);
                }
            });
            const scenarioAction = (scenario, additionalInfos) => {
                if (scenario && scenario.TvScenarioForm && scenario.TvScenarioForm.plugin && scenario.TvScenarioForm.actions && scenario.TvScenarioForm.actions.length > 0 && scenario.TvScenarioForm.plugin === this.identifier) {
                    let delay = 0;
                    scenario.TvScenarioForm.actions.forEach((formAction) => {
                        setTimeout((self) => {
                            self.action(formAction.action);
                        }, delay, this);
                        delay += (formAction.timer ? (parseFloat(formAction.timer) * 1000) : DEFAULT_ACTION_TIMER);
                    });
                }
            };
            this.api.scenarioAPI.registerSubform(TvActionsScenarioForm, buttonsActions);
            this.api.scenarioAPI.registerWithInjection(TvScenarioForm, scenarioAction, this.api.translateAPI.t("tv.scenario.title"), null, false, this.api.getPluginsIdentifiersByCategory("tv", false));
        }

        /**
         * Update dashboard tile
         *
         * @param  {int} [status=0]   The TV sattus (on => 1, off => 0)
         */
        update(status = 0) {
            const tile = this.api.dashboardAPI.Tile(this.identifier, this.api.dashboardAPI.TileType().TILE_GENERIC_ACTION_STATUS, this.api.exported.Icons.class.list()["tv-screen"], null, this.tileTitle, null, null, null, status, 8000, this.identifier, {buttons:this.buttons}, null, api.webAPI.Authentication().AUTH_GUEST_LEVEL);
            this.api.dashboardAPI.registerTile(tile);
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
    category: "tv-base",
    description: "TV base plugin",
    dependencies:[],
    classes:[]
};
