/* eslint-disable */
"use strict";

const REBOOT_ACTION = "/hard-reboot/";
const SOFT_REBOOT_ACTION = "/soft-reboot/";

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
            this.api.webAPI.register(this, api.webAPI.constants().POST, ":" + REBOOT_ACTION, api.webAPI.Authentication().AUTH_ADMIN_LEVEL);
            this.api.webAPI.register(this, api.webAPI.constants().POST, ":" + SOFT_REBOOT_ACTION, api.webAPI.Authentication().AUTH_USAGE_LEVEL);
            this.registerTile();
        }

        /**
         * Register a reboot tile
         */
        registerTile() {
            // Credits : Voysla / https://www.flaticon.com/premium-icon/restart_514734
            const svgSoft = "<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"	 viewBox=\"0 0 512.001 512.001\" style=\"enable-background:new 0 0 512.001 512.001;\" xml:space=\"preserve\"><g>	<g>		<g>			<path d=\"M330.499,78.409c-8.529-3.035-17.9,1.455-20.918,9.975c-3.017,8.52,1.455,17.891,9.984,20.909				c75.87,26.873,126.855,99.015,126.855,179.518c0,105.006-85.428,190.425-190.425,190.425S65.58,393.817,65.58,288.811				c0-80.494,50.985-152.636,126.855-179.527c8.529-3.017,12.993-12.38,9.975-20.909c-3.017-8.529-12.398-13.01-20.909-9.975				C92.568,109.906,32.815,194.464,32.815,288.811c0,123.066,100.116,223.19,223.181,223.19c123.075,0,223.19-100.124,223.19-223.19				C479.186,194.464,419.433,109.906,330.499,78.409z\"/>			<path d=\"M155.25,30.939l87.895,45.403l-46.743,90.504c-4.153,8.041-1.003,17.918,7.038,22.071				c2.405,1.251,4.979,1.837,7.508,1.837c5.937,0,11.661-3.239,14.572-8.875l54.251-105.059c4.153-8.032,0.994-17.918-7.038-22.071				l-102.45-52.92c-8.032-4.153-17.918-0.994-22.071,7.038S147.21,26.785,155.25,30.939z\"/>		</g>	</g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>";
            const tile1 = this.api.dashboardAPI.Tile("reboot-soft", this.api.dashboardAPI.TileType().TILE_GENERIC_ACTION, svgSoft, null, this.api.translateAPI.t("soft.reboot"), null, null, null, 0, 999998, SOFT_REBOOT_ACTION);
            this.api.dashboardAPI.registerTile(tile1);
            // Credits : AlternativeStd / https://www.flaticon.com/premium-icon/restart_2504547
            const svgHard = "<svg height=\"512\" viewBox=\"0 0 32 32\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><g id=\"Restart\"><path d=\"m20.3418 7.3a1 1 0 1 0 -.77 1.8457 9.29 9.29 0 1 1 -10.9556 14.1922 1 1 0 0 0 -1.5957 1.2051 11.2833 11.2833 0 1 0 13.3213-17.243z\"/><path d=\"m15.9961 17.5757a1 1 0 0 0 1-1v-12.5757a1 1 0 1 0 -2 0v12.5757a1 1 0 0 0 1 1z\"/><path d=\"m7.6191 8.0166 2.1909.2634a11.2313 11.2313 0 0 0 -1.8022 1.4622 1 1 0 0 0 1.416 1.4131 9.229 9.229 0 0 1 1.5682-1.2553l-.2508 2.09a1 1 0 0 0 .874 1.1119 1.0226 1.0226 0 0 0 .12.0073 1.0011 1.0011 0 0 0 .9921-.8809l.545-4.54a1.0008 1.0008 0 0 0 -.8741-1.1118l-4.541-.5444a1 1 0 1 0 -.2383 1.9853z\"/><path d=\"m7.2656 21.0068a1.0868 1.0868 0 0 0 -1.05-1.05 1.05 1.05 0 0 0 0 2.1 1.0872 1.0872 0 0 0 1.05-1.05z\"/><path d=\"m6.7773 17.1523a1.0868 1.0868 0 0 0 -1.05-1.05 1.05 1.05 0 1 0 0 2.1 1.0872 1.0872 0 0 0 1.05-1.05z\"/><path d=\"m6.4746 14.5879a1.05 1.05 0 0 0 0-2.1 1.05 1.05 0 0 0 0 2.1z\"/></g></svg>";
            const tile2 = this.api.dashboardAPI.Tile("reboot-hard", this.api.dashboardAPI.TileType().TILE_GENERIC_ACTION, svgHard, null, this.api.translateAPI.t("hard.reboot"), null, null, null, 0, 999999, REBOOT_ACTION);
            this.api.dashboardAPI.registerTile(tile2);
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

            if (apiRequest.route === ":" + SOFT_REBOOT_ACTION) {
                return new Promise((resolve, reject) => {
                    setTimeout((me) => {
                        me.api.coreAPI.dispatchEvent(me.api.exported.SmartiesRunnerConstants.RESTART);
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
