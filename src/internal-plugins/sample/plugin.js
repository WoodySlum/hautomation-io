/* eslint-disable */
"use strict";

function loaded(api) {
    api.init();

    // Register a tile
    const tile = api.dashboardAPI.Tile("test-plugin", api.dashboardAPI.TileType().TILE_INFO_ONE_TEXT, api.exported.Icons.class.list()["map-pin"], null, "A tile title");
    api.dashboardAPI.registerTile(tile);

    class SampleForm extends api.exported.FormObject.class {
        constructor(id, xo) {
            super(id);
            /**
             * @Property("xo");
             * @Type("string");
             * @Title("Another extended form");
             */
            this.xo = xo;
        }

        json(data) {
            return new SampleForm(data.id, data.xo);
        }
    }

    api.configurationAPI.register(SampleForm);



    /**
     * This class is a sample plugin
     * @class
     */
    class Sample {
        constructor(api) {
            this.api = api;
            this.api.webAPI.register(this, "*", ":/test/", this.api.webAPI.Authentication().AUTH_NO_LEVEL);
            this.message = "pong";
            // api.timeEventAPI.register(this.ping, this, api.timeEventAPI.constants().EVERY_SECONDS);
            api.installerAPI.register("*", "echo \"Hello !\"; set -e; exit 0;");
        }

        /**
         * Process API callback
         *
         * @param  {[type]} apiRequest An APIRequest
         * @returns {Promise}  A promise with an APIResponse object
         */
        processAPI(apiRequest) {
            return new Promise((resolve, reject) => {
                // API has been successfully processed by the class, and return a foo bar object
                resolve(this.api.webAPI.APIResponse(true, {"foo":"bar"}));
            } );
        }

        /**
         * Shows a test log
         */
        test() {
            console.log("======> I'm working !");
        }

        ping(self) {
            console.log(self.message);
        }
    }

    api.exportClass(Sample);

    let s = new Sample(api);

}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "sample-plugin",
    version: "0.0.0",
    category: "misc",
    description: "I'm a sample plugin"
};
