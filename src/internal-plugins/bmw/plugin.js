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
            this.previousChargingStatus = {};
            this.carPictures = {};

            this.api.configurationAPI.setUpdateCb(() => {
                this.updateCarInfos();
            });

            this.api.timeEventAPI.register((self, hour, minute) => {
                if (minute % 5 == 0) {
                    self.updateCarInfos();
                }
            }, this, this.api.timeEventAPI.constants().EVERY_MINUTES);
        }

        /**
         * Update car picture
         *
         * @param  {Vehicle} vehicle           The vehicle
         */
        updateCarPicture(vehicle) {
            vehicle.getImage(800, 800).then((pic) => {
                if (pic) {
                    api.exported.ImageUtils.class.crop(pic.split(",")[1], 250, 200, 250, 250, (err, picture) => {
                        this.carPictures[vehicle.originalData.vin] = picture;
                        this.previousChargingStatus[vehicle.originalData.vin] = "";
                        this.updateCarInfos();
                    });
                }
            }).catch((e) => {
                api.exported.Logger.err(e.message);
            });
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
                            for (let i = 0 ; i < vehicles.length ; i++) {
                                // Get picture
                                if (!this.carPictures[vehicles[i].originalData.vin]) {
                                    this.updateCarPicture(vehicles[i]);
                                } else {
                                    vehicles[i].getStatus().then((status) => {
                                        // Total
                                        const miniTiles = [];

                                        miniTiles.push({icon: api.exported.Icons.class.list()["cab"], text: vehicles[i].model.split(" ")[0], colorDefault: api.themeAPI.constants().DARK_COLOR_KEY});

                                        if (status.remainingRangeTotal != null && status.remainingRangeTotal != "undefined") {
                                            miniTiles.push({icon: api.exported.Icons.class.list()["fuel"], text: status.remainingRangeTotal + " km", colorDefault: api.themeAPI.constants().DARK_COLOR_KEY});
                                        }

                                        if (status.chargingLevelHv != null && status.chargingLevelHv != "undefined") {
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

                                            miniTiles.push({icon: icon, text: status.chargingLevelHv + "%" + (status.remainingRangeElectric ? " [" + status.remainingRangeElectric + " km]" : ""), colorDefault: api.themeAPI.constants().DARK_COLOR_KEY});

                                            // Send notifications
                                            if (this.previousChargingStatus[vehicles[i].originalData.vin] == "CHARGING" && status.chargingStatus != "CHARGING") {
                                                api.messageAPI.sendMessage("*", api.translateAPI.t("bmw.charged.message", vehicles[i].model));
                                            }

                                            this.previousChargingStatus[vehicles[i].originalData.vin] = status.chargingStatus;
                                        }

                                        // Closed status
                                        if (status.doorLockState == "UNLOCKED" || status.doorDriverFront != "CLOSED" || status.doorDriverRear != "CLOSED" || status.doorPassengerFront != "CLOSED" || status.doorPassengerRear != "CLOSED" || status.hood != "CLOSED" || status.windowDriverFront != "CLOSED" || status.windowDriverRear != "CLOSED" || status.windowPassengerFront != "CLOSED" || status.windowPassengerRear != "CLOSED") {
                                            miniTiles.push({icon: api.exported.Icons.class.list()["unlock"], text: api.translateAPI.t("bmw.unlocked"), colorDefault: api.themeAPI.constants().OFF_COLOR_KEY});
                                        } else {
                                            miniTiles.push({icon: api.exported.Icons.class.list()["lock"], text: api.translateAPI.t("bmw.locked"), colorDefault: api.themeAPI.constants().DARK_COLOR_KEY});
                                        }

                                        // Health
                                        if (status.conditionBasedServicingData) {
                                            let health = true;
                                            status.conditionBasedServicingData.forEach((conditionBasedServicingData) => {
                                                if (conditionBasedServicingData.state != "OK") {
                                                    health = false;
                                                }
                                            });
                                            miniTiles.push({icon: api.exported.Icons.class.list()["wrench-1"], text: (health ? api.translateAPI.t("bmw.health.ok") : api.translateAPI.t("bmw.health.ko")), colorDefault: (health ? api.themeAPI.constants().DARK_COLOR_KEY : api.themeAPI.constants().OFF_COLOR_KEY)});
                                        }

                                        miniTiles.push({icon: api.exported.Icons.class.list()["road"], text: status.mileage + " km", colorDefault: api.themeAPI.constants().DARK_COLOR_KEY});

                                        // Mini tiles
                                        const tileId = status.vin;
                                        api.dashboardAPI.unregisterTile(tileId);
                                        const tile = api.dashboardAPI.Tile(tileId, api.dashboardAPI.TileType().TILE_SUB_TILES, null, null, null, null, (this.carPictures[vehicles[i].originalData.vin] ? this.carPictures[vehicles[i].originalData.vin] : null), null, 0, 109, null, miniTiles, api.webAPI.Authentication().AUTH_USAGE_LEVEL);
                                        api.dashboardAPI.registerTile(tile);
                                    }).catch((e) => {
                                        api.exported.Logger.err(e.message);
                                    });
                                }
                            }
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
