"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * Generic camera form class
     * @class
     */
    class GenericCameraForm extends api.exported.CameraForm {
        /**
         * Generic camera form
         *
         * @param {number} id          The identifier
         * @param {string} plugin      The plugin's name
         * @param {string} name        The name
         * @param {string} ip          The ip address
         * @param {number} port        The port
         * @param {string} username    The username
         * @param {string} password    The password
         * @param {boolean} archive          Archive pictures
         * @param {string} snapshotUrl The snapshot url
         * @param {string} mjpegUrl    The mjpeg url
         * @param {string} rtspUrl     The rtsp url
         * @param {string} leftUrl     The left url
         * @param {string} rightUrl    The right url
         * @param {string} upUrl       The up url
         * @param {string} downUrl     The down url
         */
        constructor(id, plugin, name, ip, port, username, password, archive, snapshotUrl, mjpegUrl, rtspUrl, leftUrl, rightUrl, upUrl, downUrl) {
            super(id, plugin, name, ip, port, username, password, archive);

            /**
             * @Property("snapshotUrl");
             * @Title("camera.generic.snapshot.url");
             * @Type("string");
             * @Required(false);
             */
            this.snapshotUrl = snapshotUrl;

            /**
             * @Property("mjpegUrl");
             * @Title("camera.generic.mjpeg.url");
             * @Type("string");
             * @Required(false);
             */
            this.mjpegUrl = mjpegUrl;

            /**
             * @Property("rtspUrl");
             * @Title("camera.generic.rtsp.url");
             * @Type("string");
             * @Required(false);
             */
            this.rtspUrl = rtspUrl;

            /**
             * @Property("leftUrl");
             * @Title("camera.generic.left.url");
             * @Type("string");
             * @Required(false);
             */
            this.leftUrl = leftUrl;

            /**
             * @Property("rightUrl");
             * @Title("camera.generic.right.url");
             * @Type("string");
             * @Required(false);
             */
            this.rightUrl = rightUrl;

            /**
             * @Property("upUrl");
             * @Title("camera.generic.up.url");
             * @Type("string");
             * @Required(false);
             */
            this.upUrl = upUrl;

            /**
             * @Property("downUrl");
             * @Title("camera.generic.down.url");
             * @Type("string");
             * @Required(false);
             */
            this.downUrl = downUrl;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {GenericCameraForm}      An instance
         */
        json(data) {
            return new GenericCameraForm(data.id, data.plugin, data.name, data.ip, data.port, data.username, data.password, data.archive, data.snapshotUrl, data.mjpegUrl, data.rtspUrl, data.leftUrl, data.rightUrl, data.upUrl, data.down);
        }
    }

    api.cameraAPI.registerForm(GenericCameraForm);

    /**
     * Generic camera class
     * @class
     */
    class GenericCamera extends api.exported.Camera {
        /**
         * Sumpple camera
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for camera
         * @returns {GenericCamera}                                                                  The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration, configuration.snapshotUrl, configuration.mjpegUrl, configuration.rtspUrl, configuration.leftUrl, configuration.leftUrl);
        }
    }

    api.cameraAPI.registerClass(GenericCamera);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "generic-camera",
    version: "0.0.0",
    category: "camera",
    description: "Generic camera plugin",
    dependencies:["camera"]
};
