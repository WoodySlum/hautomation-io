"use strict";

const ConnectedDriveApi = require("@mihaiblaga89/bmw-connecteddrive-api");
const request = require("request");
const fs = require("fs-extra");
const sha256 = require("sha256");

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
            this.carLocations = {};
            this.registeredElements = {};

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
         * Register for car infos
         *
         * @param  {Function} cb            A callback triggered when weather information is received. Example : `(d) => {}`
         * @param  {string} id            An identifier
         */
        register(cb, id = null) {
            const index = sha256(cb.toString() + id);
            this.registeredElements[index] = cb;
        }

        /**
         * Unregister car infos
         *
         * @param  {Function} cb             A callback triggered when weather information is received. Example : `(d) => {}`
         * @param  {string} id            An identifier
         */
        unregister(cb, id = null) {
            const index = sha256(cb.toString() + id);
            if (this.registeredElements[index]) {
                delete this.registeredElements[index];
            } else {
                api.exported.Logger.warn("Element not found");
            }
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
                                        Object.keys(this.registeredElements).forEach((registeredKey) => {
                                            this.registeredElements[registeredKey](status);
                                        });

                                        if (status.position && (!this.carLocations[vehicles[i].originalData.vin] || this.carLocations[vehicles[i].originalData.vin].position.lon != status.position.lon || this.carLocations[vehicles[i].originalData.vin].position.lat != status.position.lat)) {
                                            this.carLocations[vehicles[i].originalData.vin] = {position: status.position};

                                            const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36";
                                            const reverseGeocodingUrl = "https://nominatim.openstreetmap.org/reverse?lat=" + status.position.lat + "&lon=" + status.position.lon + "&format=json";
                                            request({url: reverseGeocodingUrl, headers: { "User-Agent": userAgent}}, (error, response, body) => {
                                                let metaData = null;
                                                if (!error && response.statusCode == 200) {
                                                    metaData = JSON.parse(body);
                                                } else {
                                                    api.exported.Logger.err(body);
                                                }

                                                const long2tile = (lon, zoom) => { return (Math.floor((lon + 180)/ 360 * Math.pow(2, zoom))); };
                                                const lat2tile = (lat, zoom) => { return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))); };
                                                const zoom = 19;
                                                // const url = "http://c.tile.openstreetmap.fr/osmfr/" + zoom + "/" + long2tile(status.position.lon, zoom) + "/" + lat2tile(status.position.lat, zoom) + ".png";
                                                const url = "http://mt1.google.com/vt/lyrs=y&x=" + long2tile(status.position.lon, zoom) + "&y=" + lat2tile(status.position.lat, zoom) + "&z=" + zoom;

                                                request({url: url, encoding: "binary", headers: { "User-Agent": userAgent}}, (error, response, body) => {
                                                    if (!error && response.statusCode == 200) {
                                                        const tile = Buffer.alloc(body.length, body, "binary").toString("base64");
                                                        const car = fs.readFileSync("./res/pictures/car.png").toString("base64");

                                                        api.exported.ImageUtils.class.rotate(car, (err, data) => {
                                                            if (!err && data) {
                                                                api.exported.ImageUtils.class.merge(tile, (err, data) => {
                                                                    if (!err && data) {
                                                                        const tileId = vehicles[i].originalData.vin + "-pic";
                                                                        api.dashboardAPI.unregisterTile(tileId);
                                                                        const tile = api.dashboardAPI.Tile(tileId, api.dashboardAPI.TileType().TILE_GENERIC_ACTION_DARK, " ", null, (metaData && metaData.address && metaData.address.town) ? metaData.address.town : null, null, data, null, 0, 110, null, miniTiles, api.webAPI.Authentication().AUTH_USAGE_LEVEL);
                                                                        api.dashboardAPI.registerTile(tile);
                                                                    } else {
                                                                        api.exported.Logger.err(err);
                                                                    }

                                                                }, data, api.exported.cachePath, 116, 110);
                                                            } else {
                                                                api.exported.Logger.err(err);
                                                            }

                                                        }, status.position.heading);

                                                    } else {
                                                        api.exported.Logger.err(body);
                                                    }
                                                });
                                            });
                                        }

                                        // Credits : Freepik / https://www.flaticon.com/free-icon/bmw_805952
                                        const bmwSigle = "<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"	 viewBox=\"0 0 512 512\" style=\"enable-background:new 0 0 512 512;\" xml:space=\"preserve\"><g>	<g>		<path d=\"M265.987,24.24c-3.716,0-7.156,1.178-9.987,3.168c-2.831-1.99-6.272-3.168-9.988-3.168			c-9.609,0-17.426,7.817-17.426,17.426v33.616c0,4.142,3.358,7.5,7.5,7.5c4.142,0,7.5-3.358,7.5-7.5V41.667			c0-1.338,1.089-2.426,2.427-2.426s2.426,1.088,2.426,2.426v33.616c0,4.142,3.358,7.5,7.5,7.5c0.021,0,0.041-0.003,0.061-0.003			c0.021,0,0.04,0.003,0.061,0.003c4.142,0,7.5-3.358,7.5-7.5V41.667c0-1.338,1.088-2.426,2.426-2.426			c1.338,0,2.427,1.088,2.427,2.426v33.616c0,4.142,3.357,7.5,7.5,7.5s7.5-3.358,7.5-7.5V41.667			C283.414,32.058,275.597,24.24,265.987,24.24z\"/>	</g></g><g>	<g>		<path d=\"M181.23,75.719c-1.933-3.386-4.842-5.986-8.333-7.549c0.412-3.691-0.278-7.536-2.256-11			c-4.969-8.706-16.095-11.746-24.8-6.777L126.98,61.159c-3.598,2.053-4.849,6.634-2.796,10.231l10.588,18.55l10.588,18.55			c1.384,2.425,3.916,3.784,6.521,3.784c1.26,0,2.538-0.318,3.711-0.988l18.861-10.766C183.159,95.551,186.199,84.425,181.23,75.719			z M144.08,75.99l-3.152-5.522l12.348-7.048c1.522-0.87,3.468-0.338,4.337,1.185c0.869,1.522,0.337,3.468-1.185,4.337L144.08,75.99			z M167.017,87.493l-12.348,7.048l-3.153-5.523l6.703-3.826l5.646-3.222c0.994-0.568,1.939-0.436,2.414-0.306			c0.475,0.129,1.355,0.496,1.923,1.491C169.071,84.678,168.54,86.624,167.017,87.493z\"/>	</g></g><g>	<g>		<path d=\"M385.396,62.052c-3.599-2.052-8.179-0.8-10.231,2.798l-16.657,29.2c-0.434,0.759-1.104,1.039-1.467,1.138			c-0.363,0.099-1.082,0.2-1.843-0.233c-0.759-0.433-1.038-1.105-1.138-1.467c-0.099-0.362-0.2-1.083,0.233-1.842l16.656-29.199			c2.053-3.598,0.8-8.179-2.799-10.231c-0.015-0.009-0.031-0.015-0.047-0.024c-0.02-0.012-0.038-0.025-0.058-0.037			c-3.598-2.053-8.179-0.8-10.231,2.798l-16.657,29.198c-0.663,1.163-2.148,1.57-3.31,0.906c-1.162-0.663-1.568-2.148-0.905-3.311			l16.657-29.198c2.053-3.598,0.8-8.178-2.798-10.231c-3.599-2.052-8.179-0.799-10.231,2.798l-16.657,29.198			c-4.761,8.346-1.845,19.01,6.502,23.772c2.717,1.55,5.68,2.286,8.605,2.286c0.547,0,1.091-0.035,1.633-0.086			c1.513,3.219,3.958,5.899,7.111,7.697c2.667,1.521,5.619,2.298,8.608,2.298c1.543,0,3.096-0.207,4.624-0.625			c4.49-1.228,8.233-4.131,10.539-8.174l16.657-29.199C390.247,68.686,388.994,64.105,385.396,62.052z\"/>	</g></g><g>	<g>		<path d=\"M437.02,74.98C388.668,26.629,324.38,0,256,0C193.958,0,134.107,22.478,87.473,63.292			c-3.117,2.728-3.432,7.466-0.704,10.583c2.729,3.118,7.467,3.432,10.583,0.704C141.251,36.159,197.593,15,256,15			c132.888,0,241,108.112,241,241S388.888,497,256,497S15,388.888,15,256c0-56.646,20.041-111.685,56.43-154.976			c2.665-3.17,2.255-7.902-0.916-10.567c-3.171-2.665-7.902-2.256-10.567,0.916C21.29,137.363,0,195.829,0,256			c0,68.38,26.629,132.667,74.98,181.02C123.333,485.371,187.62,512,256,512s132.668-26.629,181.02-74.98			C485.371,388.667,512,324.38,512,256S485.371,123.333,437.02,74.98z\"/>	</g></g><g>	<g>		<path d=\"M256,90.5c-91.257,0-165.5,74.243-165.5,165.5S164.743,421.5,256,421.5S421.5,347.257,421.5,256S347.257,90.5,256,90.5z			 M248.5,105.687V248.5H105.687C109.486,171.47,171.47,109.486,248.5,105.687z M263.5,406.313v-22.479c0-4.142-3.357-7.5-7.5-7.5			c-4.142,0-7.5,3.358-7.5,7.5v22.479c-77.03-3.799-139.014-65.783-142.813-142.813H248.5v88.167c0,4.142,3.358,7.5,7.5,7.5			c4.143,0,7.5-3.358,7.5-7.5V263.5H288c4.143,0,7.5-3.358,7.5-7.5c0-4.142-3.357-7.5-7.5-7.5h-24.5V105.687			c77.031,3.799,139.014,65.783,142.813,142.813H320.5c-4.143,0-7.5,3.358-7.5,7.5c0,4.142,3.357,7.5,7.5,7.5h85.813			C402.514,340.53,340.531,402.514,263.5,406.313z\"/>	</g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>";
                                        // Credits : Kiranshastry / https://www.flaticon.com/free-icon/car-repair_846329
                                        const carRepair = "<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"	 viewBox=\"0 0 458.2 458.2\" style=\"enable-background:new 0 0 458.2 458.2;\" xml:space=\"preserve\"><g>	<g>		<path d=\"M408.6,267.4l-7.4-6.9c0-0.1-0.1-0.2-0.2-0.3l-29.8-80.5c-5.3-14.1-18.8-23.5-33.9-23.5h-211c-15.1,0-28.6,9.4-33.9,23.5			l-29.5,79.6l-11.2,9.3c-11.1,9.3-17.5,23-17.6,37.5v116c0,19.9,16.6,36.1,36.5,36.1h21.8c19.8,0,35.7-16.1,35.7-35.8			c0-0.1,0-0.2,0-0.2v-15h202v14.9c-0.2,19.8,15.7,35.9,35.5,36.1c0.1,0,0.2,0,0.2,0h21.8c19.9,0,36.5-16.2,36.5-36.1V303.2			C424.1,289.6,418.5,276.7,408.6,267.4z M111.2,186.5c2.4-6.3,8.4-10.4,15.1-10.3h210.9c6.7-0.1,12.7,4,15.1,10.3l24.9,66.7h-15.3			c-4.8-27-28.7-48.3-57.5-48.3s-52.6,21.3-57.3,48.3H86.4L111.2,186.5z M341.5,253.2h-74c5.5-20.4,26.6-32.5,47-27			C327.7,229.8,338,240,341.5,253.2z M108.2,422.1c0.2,8.7-6.7,15.9-15.4,16.1c-0.1,0-0.2,0-0.3,0H70.7c-8.9,0-16.5-7.2-16.5-16.1			v-18.6c5.2,2.5,10.8,3.7,16.5,3.7h37.5V422.1z M404.2,422.1c0,8.9-7.6,16.1-16.5,16.1h-21.8c-8.7,0-15.7-7.1-15.7-15.8			c0-0.1,0-0.2,0-0.3v-14.9h37.5c5.7,0,11.4-1.2,16.5-3.7V422.1z M387.7,387.2h-317c-8.9,0-16.5-7.1-16.5-16v-65			c0.1-8.7,3.9-16.9,10.5-22.5L77,273.2h308.9l9,8.5c5.9,5.6,9.3,13.3,9.3,21.4v68.1h0C404.2,380.1,396.6,387.2,387.7,387.2z\"/>	</g></g><g>	<g>		<path d=\"M145.2,303.2h-62c-5.5,0-10,4.5-10,10v43c0,5.5,4.5,10,10,10h62c5.5,0,10-4.5,10-10v-43			C155.2,307.7,150.7,303.2,145.2,303.2z M135.2,346.2h-42v-23h42V346.2z\"/>	</g></g><g>	<g>		<path d=\"M375.2,303.2h-62c-5.5,0-10,4.5-10,10v43c0,5.5,4.5,10,10,10h62c5.5,0,10-4.5,10-10v-43			C385.2,307.7,380.7,303.2,375.2,303.2z M365.2,346.2h-42v-23h42V346.2z\"/>	</g></g><g>	<g>		<path d=\"M269,337.2h-79.7c-5.5,0-10,4.5-10,10s4.5,10,10,10H269c5.5,0,10-4.5,10-10S274.6,337.2,269,337.2z\"/>	</g></g><g>	<g>		<path d=\"M269,312.2h-79.7c-5.5,0-10,4.5-10,10s4.5,10,10,10H269c5.5,0,10-4.5,10-10S274.6,312.2,269,312.2z\"/>	</g></g><g>	<g>		<path d=\"M390.6,58.8c5.5,0.5,10.3-3.6,10.8-9.1c0.1-1.2,0-2.4-0.4-3.6c-3.8-13.7-12.2-25.6-23.8-33.8C365.7,4.3,352.1,0,338.1,0			c-27.8,0-50.4,14.2-60.6,38.2h-99.6C165.8,18.2,143.3,5,120.2,5c-15,0-28.6,4.3-39.4,12.3c-11.6,8.6-19.6,21.4-23.2,37			c-1.2,5.4,2.1,10.8,7.5,12c1,0.2,2,0.3,3,0.2l32.6-2.5c2.4,5.5,2.4,11.7,0,17.1l-32.8-2.6c-5.5-0.5-10.3,3.6-10.8,9.1			c-0.1,1.2,0,2.4,0.4,3.6c8,27.7,32.8,45.6,63.2,45.6c27.8,0,50.4-14.6,60.6-38.6h99.2c10.5,18,30.9,33.3,56.8,33.3			c0.2,0,0.4,0.1,0.6,0.1c14.9,0,28.6-4.2,39.4-12.1c11.6-8.5,19.8-21.1,23.6-36.4c1.3-5.4-1.9-10.8-7.3-12.1			c-1-0.3-2.1-0.4-3.2-0.3l-32.6,2.5c-2.4-5.5-2.4-11.7,0-17.1L390.6,58.8z M344.5,89.8c2.1,2.7,5.3,4.2,8.7,3.9l22.6-1.8			c-7.7,12.7-21,19.7-38.1,19.8c-20.1,0.2-36.1-14.2-42.3-27.5c-1.6-3.5-5.2-5.8-9.1-5.9H174.1c-4.4,0-8.3,3-9.6,7.2			c-5.8,19.3-22.7,31.4-44,31.4c-15.6,0-28.7-6.2-36.9-17l21.4,1.8c3.4,0.3,6.7-1.2,8.8-3.9l0.2-0.3c11.4-14.9,11.3-35.4-0.2-50			c-2.1-2.7-5.3-4.1-8.7-3.8l-23,1.8c7.5-13,20.7-20.2,38-20.2c17.4,0,34.9,11.2,42.7,27.5c1.7,3.4,5.2,5.6,9,5.5h112.6			c4.4,0.1,8.3-2.7,9.6-6.9c5.8-19.3,22.7-31.2,43.9-31.2c15.5,0.1,28.6,6.5,36.8,17.3l-21.4-1.8c-3.4-0.3-6.7,1.2-8.8,3.9l-0.2,0.3			C333.1,54.7,333.2,75.1,344.5,89.8z\"/>	</g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>";
                                        // Credits : yut1655 / https://www.flaticon.com/premium-icon/oil-gauge_2902370
                                        const carFuel = "<svg id=\"Tempate\" height=\"512\" viewBox=\"0 0 900 900\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><g id=\"_36-Fuel_gauge\" data-name=\"36-Fuel gauge\"><path d=\"m731.8 473.5a15.58 15.58 0 0 0 8-2.2l100.6-58.2a16.46 16.46 0 0 0 7.5-9.8 16 16 0 0 0 -1.6-12.1 460.06 460.06 0 0 0 -796.8.1 16 16 0 0 0 5.9 21.9l96.2 55.7a15.58 15.58 0 0 0 8 2.2 16 16 0 0 0 8.1-29.9l-82.2-47.6a427.49 427.49 0 0 1 134.6-134.4l27.9 48.5a16.07 16.07 0 0 0 13.9 8 16.49 16.49 0 0 0 8-2.1 16 16 0 0 0 5.9-21.9l-28-48.6a428.49 428.49 0 0 1 183.9-49.6v88.7a16 16 0 0 0 32 0v-88.7a426.93 426.93 0 0 1 184 49.4l-28.1 48.7a16 16 0 0 0 5.9 21.9 16.49 16.49 0 0 0 8 2.1 16.19 16.19 0 0 0 13.9-8l28-48.7a427.4 427.4 0 0 1 134.8 134.5l-86.5 50a16 16 0 0 0 -5.8 21.9 15.76 15.76 0 0 0 13.9 8.2z\"/><path d=\"m535.3 621.9-72.5-284a16 16 0 0 0 -15.5-12 16 16 0 0 0 -15.5 12.1l-71.7 285.3c0 .2-.1.4-.1.6a92.78 92.78 0 0 0 -3.1 23.7 91.1 91.1 0 1 0 182.2 0 94.48 94.48 0 0 0 -3.8-25.7zm-87.9-214.9 40.5 158.7a91.17 91.17 0 0 0 -40-9.3 90 90 0 0 0 -40.4 9.5zm.5 299.6a59.1 59.1 0 1 1 59.1-59.1 59.15 59.15 0 0 1 -59.1 59.1z\"/><path d=\"m163.6 578.1a16 16 0 1 0 0-32h-100.2a16 16 0 0 0 -16 16v160.5a16 16 0 0 0 16 16h100.2a16 16 0 1 0 0-32h-84.2v-48h84.2a16 16 0 1 0 0-32h-84.2v-48.4h84.2z\"/><path d=\"m837.2 546.1h-100.6a16 16 0 0 0 -16 16v160.5a16 16 0 0 0 32 0v-64h64.4a16 16 0 0 0 0-32h-64.4v-48.4h84.6a16.05 16.05 0 0 0 0-32.1z\"/></g></svg>";
                                        miniTiles.push({icon: bmwSigle, text: vehicles[i].model.split(" ")[0], colorDefault: api.themeAPI.constants().DARK_COLOR_KEY});

                                        if (status.remainingRangeTotal != null && status.remainingRangeTotal != "undefined") {
                                            miniTiles.push({icon: carFuel, text: status.remainingRangeTotal + " km", colorDefault: api.themeAPI.constants().DARK_COLOR_KEY});
                                        }

                                        if (status.chargingLevelHv != null && status.chargingLevelHv != "undefined") {
                                            let icon = api.exported.Icons.class.list()["battery-2"];
                                            if (status.chargingStatus == "CHARGING") {
                                                icon = api.exported.Icons.class.list()["battery-charging"];
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

                                            miniTiles.push({icon: icon, text: status.chargingLevelHv + "%" + (status.remainingRangeElectric ? " [" + status.remainingRangeElectric + "]" : ""), colorDefault: api.themeAPI.constants().DARK_COLOR_KEY});

                                            // Send notifications
                                            if (this.previousChargingStatus[vehicles[i].originalData.vin] == "CHARGING" && status.chargingStatus != "CHARGING") {
                                                api.messageAPI.sendMessage("*", api.translateAPI.t("bmw.charged.message", vehicles[i].model));
                                            }

                                            this.previousChargingStatus[vehicles[i].originalData.vin] = status.chargingStatus;
                                        }

                                        // Closed status
                                        if (status.doorLockState == "UNLOCKED" || status.doorDriverFront != "CLOSED" || status.doorDriverRear != "CLOSED" || status.doorPassengerFront != "CLOSED" || status.doorPassengerRear != "CLOSED" || status.hood != "CLOSED" || status.windowDriverFront != "CLOSED" || status.windowDriverRear != "CLOSED" || status.windowPassengerFront != "CLOSED" || status.windowPassengerRear != "CLOSED") {
                                            miniTiles.push({icon: api.exported.Icons.class.list()["unlocked"], text: api.translateAPI.t("bmw.unlocked"), colorDefault: api.themeAPI.constants().OFF_COLOR_KEY});
                                        } else {
                                            miniTiles.push({icon: api.exported.Icons.class.list()["locked"], text: api.translateAPI.t("bmw.locked"), colorDefault: api.themeAPI.constants().DARK_COLOR_KEY});
                                        }

                                        // Health
                                        if (status.conditionBasedServicingData) {
                                            let health = true;
                                            status.conditionBasedServicingData.forEach((conditionBasedServicingData) => {
                                                if (conditionBasedServicingData.state != "OK") {
                                                    health = false;
                                                }
                                            });
                                            miniTiles.push({icon: carRepair, text: (health ? api.translateAPI.t("bmw.health.ok") : api.translateAPI.t("bmw.health.ko")), colorDefault: (health ? api.themeAPI.constants().DARK_COLOR_KEY : api.themeAPI.constants().OFF_COLOR_KEY)});
                                        }

                                        miniTiles.push({icon: api.exported.Icons.class.list()["road"], text: status.mileage + " km", colorDefault: api.themeAPI.constants().DARK_COLOR_KEY});

                                        // Mini tiles
                                        const tileId = status.vin;
                                        api.dashboardAPI.unregisterTile(tileId);
                                        const tile = api.dashboardAPI.Tile(tileId, api.dashboardAPI.TileType().TILE_SUB_TILES, null, null, null, null, null, null, 0, 109, null, miniTiles, api.webAPI.Authentication().AUTH_USAGE_LEVEL);
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
