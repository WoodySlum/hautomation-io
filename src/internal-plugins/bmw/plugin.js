"use strict";

const ConnectedDriveApi = require("@mihaiblaga89/bmw-connecteddrive-api");

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
    * This class is used for bmw form
    * @class
    */
    class BmwForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id           Identifier
         * @param  {string} zone       The zone
         * @param  {string} username       The username
         * @param  {string} password       The password
         * @returns {BmwForm}              The instance
         */
        constructor(id, zone, username, password) {
            super(id);

            /**
             * @Property("zone");
             * @Type("string");
             * @Title("bmw.zone");
             * @Enum(["eu", "us", "cn"]);
             * @EnumNames(["eu", "us", "cn"]);
             * @Default("eu");
             */
            this.zone = zone;

            /**
             * @Property("username");
             * @Type("string");
             * @Title("bmw.username");
             */
            this.username = username;

            /**
             * @Property("password");
             * @Type("string");
             * @Display("password");
             * @Title("bmw.password");
             */
            this.password = password;
        }

        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {BmwForm}      A form object
         */
        json(data) {
            return new BmwForm(data.id, data.zone, data.username, data.password);
        }
    }

    api.configurationAPI.register(BmwForm);

    /**
     * This class manage bmw cars
     * @class
     */
    class Bmw {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The api
         * @returns {Bmw}     The instance
         */
        constructor(api) {
            this.api = api;
            this.updateCarInfos();

            this.api.configurationAPI.setUpdateCb(() => {
                this.updateCarInfos();
            });

            this.api.timeEventAPI.register((self, minute) => {
                if (minute % 5 == 0) {
                    self.updateCarInfos();
                }
            }, this, this.api.timeEventAPI.constants().EVERY_MINUTES);
        }

        /**
         * Update car infos
         */
        updateCarInfos() {
            const configuration = api.configurationAPI.getConfiguration();

            if (configuration && configuration.zone && configuration.username && configuration.password) {
                ConnectedDriveApi.init({
                    region: configuration.zone,
                    username: configuration.username,
                    password: configuration.password
                }).then(() => {
                    ConnectedDriveApi.getVehicles().then((vehicles) => {
                        if (vehicles.length > 0) {
                            vehicles[0].getStatus().then((status) => {
                                if (status.remainingRangeTotal != null && status.remainingRangeTotal != "undefined") {
                                    const tileId = status.vin + "-fuel";
                                    api.dashboardAPI.unregisterTile(tileId);
                                    const tile = api.dashboardAPI.Tile(tileId, api.dashboardAPI.TileType().TILE_INFO_TWO_ICONS, api.exported.Icons.class.list()["cab"], api.exported.Icons.class.list()["fuel"], status.remainingRangeTotal + " km", null, null, null, null, 108, null, null, null, api.webAPI.Authentication().AUTH_USAGE_LEVEL);
                                    api.dashboardAPI.registerTile(tile);
                                }

                                if (status.chargingLevelHv != null && status.chargingLevelHv != "undefined") {
                                    const tileId = status.vin + "-charge";
                                    api.dashboardAPI.unregisterTile(tileId);

                                    let icon = api.exported.Icons.class.list()["battery-2"];
                                    if (status.chargingStatus == "CHARGING") {
                                        icon = api.exported.Icons.class.list()["plug-1"];
                                    } else if (status.chargingLevelHv < 25) {
                                        icon = api.exported.Icons.class.list()["battery-0"];
                                    } else if (status.chargingLevelHv < 50) {
                                        icon = api.exported.Icons.class.list()["battery-1"];
                                    } else if (status.chargingLevelHv < 75) {
                                        icon = api.exported.Icons.class.list()["battery-2"];
                                    } else if (status.chargingLevelHv < 95) {
                                        icon = api.exported.Icons.class.list()["battery-3"];
                                    } else {
                                        icon = api.exported.Icons.class.list()["battery-4"];
                                    }
                                    const tile = api.dashboardAPI.Tile(tileId, api.dashboardAPI.TileType().TILE_INFO_TWO_ICONS, api.exported.Icons.class.list()["cab"], icon, status.chargingLevelHv + " %" + (status.remainingRangeElectric ? " [" + status.remainingRangeElectric + " km]" : ""), null, null, null, null, 108, null, null, null, api.webAPI.Authentication().AUTH_USAGE_LEVEL);
                                    api.dashboardAPI.registerTile(tile);
                                }

                            }).catch((e) => {
                                api.exported.Logger.err(e.message);
                            });
                        }
                    }).catch((e) => {
                        api.exported.Logger.err(e.message);
                    });
                }).catch((e) => {
                    api.exported.Logger.err(e.message);
                });
            }
        }
    }

    api.registerInstance(new Bmw(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "bmw",
    version: "0.0.0",
    category: "misc",
    defaultDisabled: true,
    description: "BMW connected drive"
};
