"use strict";
const PrivateProperties = require("./../PrivateProperties");
const pathl = require("path");
const callsite = require("callsite");

/**
 * Public API for iot
 * @class
 */
class IotAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {IotManager} iotManager The IoT manager instance
    //  * @returns {IotAPI}             The instance
    //  */
    constructor(iotManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).iotManager = iotManager;
        this.iotApp = null;
    }

    /**
     * Register an IoT library
     * A library folder should contain `global_lib` and `lib` folder, inside `path` parameter
     *
     * @param  {string} path        The library path
     * @param  {string} appId       An app identifier
     * @param  {int} [version=0] A version number
     * @param  {FormObject} [form=null] A form
     * @param  {...Object} inject      Some form injection parameters
     */
    registerLib(path, appId, form = null, ...inject) {
        const callerPath = pathl.dirname(callsite()[1].getFileName());
        PrivateProperties.oprivate(this).iotManager.registerLib(callerPath + "/" + path, appId, form, ...inject);
    }

    /**
     * Register an IoT library
     * An IoT app folder should contain `global_lib`, `lib` and `src` folder, inside `path` parameter.
     * A `main.cpp` file should be created under `src` folder.
     *
     * @param  {string} path           The application file path
     * @param  {string} appId          An app identifier
     * @param  {string} name           The app name
     * @param  {int} version           The application version number
     * @param  {string} platform       A platform
     * @param  {string} board          A board type
     * @param  {string} framework      A framework
     * @param  {Array} dependencies    The array of library dependencies. Can be en empty array or an array of library app identifiers.
     * @param  {Object} [options=null] A list of options injected in IoT configuration during flash sequence
     * @param  {FormObject} [form=null] A form
     * @param  {...Object} inject      Some form injection parameters
     */
    registerApp(path, appId, name, version, platform, board, framework, form = null, ...inject) {
        const callerPath = pathl.dirname(callsite()[1].getFileName());
        PrivateProperties.oprivate(this).iotManager.registerApp(callerPath + "/" + path, appId, name, version, platform, board, framework, form, ...inject);
        this.iotApp = appId;
    }

    /**
     * Check if an IoT app exists
     *
     * @param  {string} appId An app identifier
     * @returns {boolean}       `true` if the iot app is registered, `false` otherwise
     */
    iotAppExists(appId) {
        return PrivateProperties.oprivate(this).iotManager.iotAppExists(appId);
    }

    /**
     * Get a version for a specific IoT app
     *
     * @param  {string} appId An app identifier
     * @returns {int}       A version number
     */
    getVersion(appId) {
        return PrivateProperties.oprivate(this).iotManager.getVersion(appId);
    }

    /**
     * Retrieve an IoT (not application, but configured instance)
     *
     * @param  {number} id An IoT identifier
     * @returns {Object}    An IoT configuration object
     */
    getIot(id) {
        return PrivateProperties.oprivate(this).iotManager.getIot(id);
    }

    /**
     * Build a firmware for a specific appId
     *
     * @param  {string}   appId         An app identifier
     * @param  {Boolean}  [flash=false] `true` if USB flash sequence should be done after build, `false` otherwise
     * @param  {Object}   [config=null] A configuration injected to firmware
     * @param  {Function} cb            A callback `(error, result) => {}` called when firmware / flash is done. The result object contains 2 properties, `firmwarePath` for the firmware, `stdout` for the results
     */
    build(appId, flash = false, config = null, cb) {
        PrivateProperties.oprivate(this).iotManager.build(appId, flash, config, cb);
    }
}

module.exports = {class:IotAPI};
