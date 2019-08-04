"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * Sumpple form camera
     * @class
     */
    class SumppleCameraForm extends api.exported.CameraForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {SumppleCameraForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.cameraAPI.registerForm(SumppleCameraForm);

    /**
     * Sumpple camera class
     * @class
     */
    class Sumpple extends api.exported.Camera {
        /**
         * Sumpple camera
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for camera
         * @returns {Sumpple}                                                                  The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration, "cgi-bin/video_snapshot.cgi?user=%username%&pwd=%password%", "cgi-bin/videostream.cgi?user=%username%&pwd=%password%", "live/av0?user=%username%&passwd=%password%");
        }

    }

    api.cameraAPI.registerClass(Sumpple);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "sumpple",
    version: "0.0.0",
    category: "camera",
    description: "Sumpple plugin",
    defaultDisabled: true,
    dependencies:["camera"]
};
