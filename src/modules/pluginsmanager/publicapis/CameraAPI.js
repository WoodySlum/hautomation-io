"use strict";
const PrivateProperties = require("./../PrivateProperties");

/**
 * Public API for camera
 * @class
 */
class CameraAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {FormManager} formManager A form manager
    //  * @param  {PluginAPI} plugin        Plugin API
    //  * @param  {CamerasManager} camerasManager        The cameras manager
    //  * @return {CameraAPI}             The instance
    //  */
    constructor(formManager, plugin, camerasManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).formManager = formManager;
        PrivateProperties.oprivate(this).plugin = plugin;
        PrivateProperties.oprivate(this).camerasManager = camerasManager;
        this.form = null;
        this.cameraClass = null;
    }
    /* eslint-enable */

    /**
     * Register a camera form
     *
     * @param  {Class} formClass A form annotation's implemented class
     * @param  {...Object} inject    The injected objects
     */
    registerForm(formClass, ...inject) {
        this.form = formClass;
        PrivateProperties.oprivate(this).formManager.registerWithAdditionalFields(formClass,{plugin:[{ key: "Type", value: "string" },{ key: "Hidden", value: true },{ key: "Default", value: PrivateProperties.oprivate(this).plugin.identifier}]}, ...inject);
        PrivateProperties.oprivate(this).plugin.exportClass(formClass);
    }

    /**
     * Register a camera class
     *
     * @param  {Class} c A camera extended class
     */
    registerClass(c) {
        this.cameraClass = c;
        PrivateProperties.oprivate(this).plugin.exportClass(c);
    }

    /**
     * Get all cameras
     *
     * @returns {Object} On object with id:name
     */
    getCameras() {
        return PrivateProperties.oprivate(this).camerasManager.getAllCameras();
    }
}

module.exports = {class:CameraAPI};
