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
                                self.api.messageAPI.sendMessage("*", self.api.translateAPI.t("camera.alert.detected.message", (detectedObject.charAt(0).toUpperCase() + detectedObject.slice(1)), self.api.cameraAPI.getCameras()[cameraId], confidence));
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
            const tile = this.api.dashboardAPI.Tile(CAMERA_REGISTER_KEY, this.api.dashboardAPI.TileType().TILE_GENERIC_ACTION, api.exported.Icons.class.list()["bell"], null, api.translateAPI.t("camera.alert.tile.title"), null, null, null, null, 101, CAMERA_REGISTER_KEY, {buttons: buttons}, null, api.webAPI.Authentication().AUTH_USAGE_LEVEL);
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
