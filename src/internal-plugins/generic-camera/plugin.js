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
    class GenericCameraForm extends api.exported.FormObject.class {
        /**
         * Camera form
         *
         * @param  {number} id              An identifier
         * @param  {string} plugin          A plugin
         * @param  {string} name            Camera's name
         * @param {string} snapshotUrl The snapshot URL (jpeg)
         * @param {string} mjpegUrl    The MJPEG stream URL
         * @param {string} rtspUrl     The RTSP stream URL
         * @param {string} leftUrl     The move left camera URL
         * @param {string} rightUrl    The move right camera URL
         * @param {string} upUrl       The move up camera URL
         * @param {string} downUrl     The move down camera URL
         *
         * @returns {GenericCameraForm}                 The instance
         */
        constructor(id, plugin, name, snapshotUrl, mjpegUrl, rtspUrl, leftUrl, rightUrl, upUrl, downUrl) {
            super(id);

            this.plugin = plugin;


        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {GenericCameraForm}      An instance
         */
        json(data) {
            super.json(data);
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
            super(api, id, configuration, "cgi-bin/video_snapshot.cgi?user=%username%&pwd=%password%", "cgi-bin/videostream.cgi?user=%username%&pwd=%password%", "live/av0?user=%username%&passwd=%password%");
        }

    }

    // api.cameraAPI.registerClass(GenericCamera);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "generic-camera",
    version: "0.0.0",
    category: "camera",
    description: "Generic camera plugin",
    dependencies:["camera"]
};
