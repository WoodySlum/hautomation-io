"use strict";
const CAMERA_REGISTER_KEY = "plugin-camera-alert";
const LOCK_S = 2 * 60;

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
         * @returns {CameraAlertForm}              The instance
         */
        constructor(id, objects) {
            super(id);

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
            return new CameraAlertForm(data.id, data.objects);
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
            this.registerAlert();
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
            if (configuration && configuration.objects && configuration.objects.length > 0) {
                const self = this;
                this.api.cameraAPI.registerCameraEvent("*", configuration.objects, CAMERA_REGISTER_KEY, (cameraId, detectedObject, confidence) => {
                    if (!self.locks[detectedObject] || self.api.exported.DateUtils.class.timestamp() > (self.locks[detectedObject] + LOCK_S)) {
                        self.locks[detectedObject] = self.api.exported.DateUtils.class.timestamp();
                        self.api.messageAPI.sendMessage("*", self.api.translateAPI.t("camera.alert.detected.message", (detectedObject.charAt(0).toUpperCase() + detectedObject.slice(1)), self.api.cameraAPI.getCameras()[cameraId], confidence));
                        self.api.cameraAPI.getImage(cameraId, (err, data) => {
                            self.api.messageAPI.sendMessage("*", null, null, null, data.toString("base64"));
                        });
                    }
                });
            }
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
