"use strict";
const CAMERA_REGISTER_KEY = "plugin-camera-alert";
const LOCK_S = 2 * 60;
const ALERT_VALIDITY_S = 60 * 60;

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
    * This class is used for camera alert form
    * @class
    */
    class CameraAlertForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id           Identifier
         * @param  {Array} objects       The detected objects
         * @param  {number} mode       The mode
         * @param  {boolean} tile       The tile
         * @param  {boolean} onlyOnDay       Only on day
         * @returns {CameraAlertForm}              The instance
         */
        constructor(id, objects, mode = 0, tile = true, onlyOnDay = false) {
            super(id);

            /**
             * @Property("tile");
             * @Type("boolean");
             * @Title("camera.alert.detected.tile");
             * @Default(true);
             */
            this.tile = tile;

            /**
             * @Property("onlyOnDay");
             * @Type("boolean");
             * @Title("camera.alert.detected.only.on.day");
             * @Default(false);
             */
            this.onlyOnDay = onlyOnDay;

            /**
             * @Property("mode");
             * @Type("number");
             * @Title("camera.alert.detected.mode");
             * @Enum([0, 1, 2]);
             * @EnumNames(["camera.alert.detected.mode.never", "camera.alert.detected.mode.always", "camera.alert.detected.mode.on.alarm"]);
             * @Display("radio");
             * @Default(0);
             */
            this.mode = mode;

            /**
             * @Property("objects");
             * @Type("string");
             * @Title("camera.alert.detected.objects");
             * @Enum("getObjects");
             * @EnumNames("getObjectsTitle");
             * @Display("checkbox");
             */
            this.objects = objects;
        }

        /**
         * Form injection method
         *
         * @param  {...Object} inject The objects title
         * @returns {Array}        An array of objects title
         */
        static getObjectsTitle(...inject) {
            return inject[0];
        }

        /**
         * Form injection method
         *
         * @param  {...Object} inject The objects
         * @returns {Array}        An array of objects
         */
        static getObjects(...inject) {
            return inject[1];
        }


        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {CameraAlertForm}      A form object
         */
        json(data) {
            return new CameraAlertForm(data.id, data.objects, data.mode, data.tile, data.onlyOnDay);
        }
    }

    const detectedObjects = api.cameraAPI.getAvailableDetectedObjects();
    api.configurationAPI.register(CameraAlertForm, detectedObjects.map((x) => { return x.charAt(0).toUpperCase() + x.slice(1); }), detectedObjects);


    /**
     * This class manage camera alert
     * @class
     */
    class CameraAlert {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The api
         * @returns {CameraAlert}     The instance
         */
        constructor(api) {
            this.api = api;
            this.locks = {};
            this.eventsRegisteredKeys = [];
            this.registerAlert();
            this.api.webAPI.register(this, this.api.webAPI.constants().POST, ":/" + CAMERA_REGISTER_KEY + "/[set*]/[action*]/", api.webAPI.Authentication().AUTH_USAGE_LEVEL);
            this.api.configurationAPI.setUpdateCb(() => {
                this.registerAlert();
            });
        }

        /**
         * Register for camera alert
         */
        registerAlert() {
            const configuration = this.api.configurationAPI.getConfiguration();
            this.api.cameraAPI.unregisterCameraEvent(CAMERA_REGISTER_KEY);
            this.locks = {};
            this.api.dashboardAPI.unregisterTile(CAMERA_REGISTER_KEY);
            if (configuration && configuration.tile) {
                this.registerTile();
            }

            if (configuration && configuration.objects && configuration.objects.length > 0 && configuration.mode > 0) {
                const self = this;

                this.api.cameraAPI.registerCameraEvent("*", configuration.objects, CAMERA_REGISTER_KEY, (cameraId, detectedObject, confidence, cvData, img, drawedImg) => {
                    if (!self.locks[detectedObject] || self.api.exported.DateUtils.class.timestamp() > (self.locks[detectedObject] + LOCK_S)) {
                        if ((configuration.mode === 1 || configuration.mode === 2 && self.api.alarmAPI.alarmStatus())) {
                            if (!configuration.onlyOnDay || (configuration.onlyOnDay && !self.api.environmentAPI.isNight())) {
                                self.locks[detectedObject] = self.api.exported.DateUtils.class.timestamp();
                                self.api.messageAPI.sendMessage("*", self.api.translateAPI.t("camera.alert.detected.message", self.api.translateAPI.t("ai." + detectedObject), self.api.cameraAPI.getCameras()[cameraId], confidence));
                                self.api.messageAPI.sendMessage("*", null, null, null, drawedImg.toString("base64"));
                            }
                        }
                    }
                });
            }
        }

        /**
         * Register tile
         */
        registerTile() {
            const buttons = [{human: ""}, {car: ""}, {dog: ""}, {cat: ""}];
            // Credit : Freepik / https://www.flaticon.com/free-icon/message_3622090
            const svg = "<svg id=\"Capa_1\" enable-background=\"new 0 0 512 512\" height=\"512\" viewBox=\"0 0 512 512\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><g><path d=\"m497 0h-482c-8.284 0-15 6.716-15 15v396.126c0 8.284 6.716 15 15 15h51.616v70.874c0 5.95 3.517 11.337 8.964 13.732 1.94.853 3.994 1.269 6.033 1.269 3.686 0 7.323-1.359 10.145-3.949l89.273-81.926h315.969c8.284 0 15-6.716 15-15v-396.126c0-8.284-6.716-15-15-15zm-15 396.126h-306.807c-3.756 0-7.375 1.409-10.142 3.948l-68.434 62.801v-51.75c0-8.284-6.716-15-15-15h-51.617v-366.125h452z\"/><path d=\"m256 353.993c77.348 0 140.275-62.927 140.275-140.275s-62.927-140.276-140.275-140.276-140.275 62.928-140.275 140.276 62.927 140.275 140.275 140.275zm0-250.551c60.806 0 110.275 49.469 110.275 110.275s-49.469 110.276-110.275 110.276-110.275-49.469-110.275-110.275 49.469-110.276 110.275-110.276z\"/><path d=\"m256 228.344c8.284 0 15-6.716 15-15v-62.654c0-8.284-6.716-15-15-15s-15 6.716-15 15v62.654c0 8.284 6.716 15 15 15z\"/><path d=\"m256 291.745c7.846 0 15.363-6.899 15-15-.364-8.127-6.591-15-15-15-7.846 0-15.363 6.899-15 15 .364 8.127 6.591 15 15 15z\"/></g></svg>";
            const tile = this.api.dashboardAPI.Tile(CAMERA_REGISTER_KEY, this.api.dashboardAPI.TileType().TILE_GENERIC_ACTION, svg, null, api.translateAPI.t("camera.alert.tile.title"), null, null, null, null, 101, CAMERA_REGISTER_KEY, {buttons: buttons}, null, api.webAPI.Authentication().AUTH_USAGE_LEVEL);
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
            if (apiRequest.route.startsWith(":/" + CAMERA_REGISTER_KEY + "/")) {
                return new Promise((resolve) => {
                    if (apiRequest.data && apiRequest.data.action) {
                        self.action(apiRequest.data.action, apiRequest.authenticationData.username);
                    }

                    resolve(self.api.webAPI.APIResponse(true, {success:true}));
                });
            }
        }

        /**
         * Handle button actions
         *
         * @param  {string} name The action name
         * @param  {string} username The username of the request
         */
        action(name, username) {
            const self = this;
            const configuration = this.api.configurationAPI.getConfiguration();
            const key = CAMERA_REGISTER_KEY + "-action-" + name + "-" + this.api.exported.DateUtils.class.timestamp();
            this.eventsRegisteredKeys.push(key);
            this.api.cameraAPI.unregisterCameraEvent(key);
            this.api.cameraAPI.registerCameraEvent("*", name, key, (cameraId, detectedObject, confidence, cvData, img, drawedImg) => {
                if (!configuration.onlyOnDay || (configuration.onlyOnDay && !self.api.environmentAPI.isNight())) {
                    if (self.eventsRegisteredKeys.indexOf(key) != -1) {
                        self.api.messageAPI.sendMessage([username], self.api.translateAPI.t("camera.alert.detected.message", (detectedObject.charAt(0).toUpperCase() + detectedObject.slice(1)), self.api.cameraAPI.getCameras()[cameraId], confidence));
                        self.api.messageAPI.sendMessage([username], null, null, null, drawedImg.toString("base64"));

                    }
                }
                self.api.cameraAPI.unregisterCameraEvent(key);
            });

            setTimeout((self) => {
                self.api.cameraAPI.unregisterCameraEvent(key);
                if (self.eventsRegisteredKeys.indexOf(key) != -1) {
                    self.eventsRegisteredKeys.splice(self.eventsRegisteredKeys.indexOf(key), 1);
                }
            }, ALERT_VALIDITY_S * 1000, this);

            self.api.messageAPI.sendMessage([username], self.api.translateAPI.t("camera.alert.detection.enabled.message", name, (ALERT_VALIDITY_S / 60)));
        }
    }

    api.registerInstance(new CameraAlert(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "camera-alert",
    version: "0.0.0",
    category: "misc",
    defaultDisabled: true,
    description: "Camera alerts based on computer vision"
};
