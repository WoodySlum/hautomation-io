"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by cameras forms
     * @class
     */
    class CameraForm extends api.exported.FormObject.class {
        /**
         * Cemra form
         *
         * @param  {number} id              An identifier
         * @param  {string} plugin          A plugin
         * @param  {string} name            Camera's name
         * @param  {string} ip              Camera's IP
         * @param  {string} port              Camera's port
         * @param  {string} username          Camera's username
         * @param  {string} password          Camera's password
         * @returns {CameraForm}                 The instance
         */
        constructor(id, plugin, name, ip, port, username, password) {
            super(id);

            this.plugin = plugin;

            /**
             * @Property("name");
             * @Title("camera.name");
             * @Type("string");
             * @Required(true);
             */
            this.name = name;

            /**
             * @Property("default");
             * @Title("camera.default");
             * @Type("boolean");
             * @Default(false);
             */
            this.name = name;

            /**
             * @Property("ip");
             * @Title("camera.form.ip");
             * @Type("string");
             * @Required(true);
             * @Regexp("[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}");
             */
            this.ip = ip;

            /**
             * @Property("port");
             * @Title("camera.form.port");
             * @Type("number");
             * @Required(true);
             * @Min(1);
             * @Max(65535);
             */
            this.port = port;

            /**
             * @Property("username");
             * @Title("camera.form.username");
             * @Type("string");
             * @Required(false);
             */
            this.username = username;

            /**
             * @Property("password");
             * @Title("camera.form.password");
             * @Type("string");
             * @Required(false);
             */
            this.password = password;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {CameraForm}      An instance
         */
        json(data) {
            return new CameraForm(data.id, data.plugin, data.name, data.ip, data.port, data.username, data.password);
        }
    }

    api.cameraAPI.registerForm(CameraForm);

    /**
     * This class is extended by cameras
     * @class
     */
    class Camera {

        /**
         * Camera class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for camera
         * @param  {string} [snapshotUrl=null]   The snapshot URL template (Parameters : %port%, %ip%, %username%, %password%), without protocol and ip. For example, `cgi-bin/snap.cgi?username=%username%&password=%password%`
         * @param  {string} [mjpegUrl=null]      The MJPEG URL template (Parameters : %port%, %ip%, %username%, %password%), without protocol and ip. For example, `cgi-bin/videostream.cgi?username=%username%&password=%password%`
         * @param  {string} [rtspUrl=null]       The RTSP URL template (Parameters : %port%, %ip%, %username%, %password%), without protocol and ip. For example, `cgi-bin/snap.cgi?username=%username%&password=%password%`
         * @param  {Function} [leftCb=null]        Move left callback
         * @param  {Function} [rightCb=null]       Move right callback
         * @param  {Function} [upCb=null]          Move up callback
         * @param  {Function} [downCb=null]        Move down callback
         * @returns {Camera}                      The instance
         */
        constructor(api, id = null, configuration = null, snapshotUrl = null, mjpegUrl = null, rtspUrl = null, leftCb = null, rightCb = null, upCb = null, downCb = null) {
            this.api = api;
            this.id = id;
            this.configuration = configuration;
            this.name = this.configuration.name;
            this.default = this.configuration.default;
            this.leftCb = leftCb;
            this.rightCb = rightCb;
            this.upCb = upCb;
            this.downCb = downCb;
            this.snapshotUrl = this.generateUrlFromTemplate(snapshotUrl);
            this.mjpegUrl = this.generateUrlFromTemplate(mjpegUrl);
            this.rtspUrl = this.generateUrlFromTemplate(rtspUrl);
        }

        /**
         * Needs to be call when camera is ready
         */
        init() {

        }

        /**
         * Does the plugin suppport mjpeg stream
         *
         * @returns {boolean} true if supported, false otherwise
         */
        mjpegSupport() {
            return this.mjpegUrl?true:false;
        }

        /**
         * Does the plugin suppport rtsp stream
         *
         * @returns {boolean} true if supported, false otherwise
         */
        rtspSupport() {
            return this.rtspUrl?true:false;
        }

        /**
         * Does the plugin suppport moves
         *
         * @returns {boolean} true if supported, false otherwise
         */
        moveSupport() {
            return (this.leftCb|this.rightCb|this.upCb|this.downCb)?true:false;
        }

        /**
         * Generate an URL from the template
         *
         * @param  {string} [url=null] An URL template (Parameters : %port%, %ip%, %username%, %password%), without protocol and ip. For example, `cgi-bin/videostream.cgi?username=%username%&password=%password%`
         * @returns {string}            The complete URL
         */
        generateUrlFromTemplate(url = null) {
            if (url) {
                let pUrl = "http://";
                if (this.configuration.port) {
                    if (this.configuration.port === 443) {
                        pUrl = "https://";
                    }
                }

                pUrl += this.configuration.ip + ":" + this.configuration.port;
                pUrl += "/" + url;

                pUrl = pUrl.replace("%username%", this.configuration.username);
                pUrl = pUrl.replace("%password%", this.configuration.password);

                return pUrl;
            }

            return null;
        }

        /**
         * Move left camera
         */
        moveLeft() {
            if (this.leftCb) {
                this.leftCb();
            }
        }

        /**
         * Move right camera
         */
        moveRight() {
            if (this.rightCb) {
                this.rightCb();
            }
        }

        /**
         * Move up camera
         */
        moveUp() {
            if (this.upCb) {
                this.upCb();
            }
        }

        /**
         * Move down camera
         */
        moveDown() {
            if (this.downCb) {
                this.downCb();
            }
        }
    }

    api.cameraAPI.registerClass(Camera);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "camera",
    version: "0.0.0",
    category: "camera-base",
    description: "Camera base plugin"
};
