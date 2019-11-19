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
     * @param  {Object} [wiringSchema={}] A wiring schema with the following properties, e.g. : `{left:{"D1":[], "D2":[]}, right:{"D3":[], "D4":[]}, up:{}, down:{}}`
     * @param  {FormObject} [form=null] A form
     * @param  {...Object} inject      Some form injection parameters
     */
    registerLib(path, appId, version = 0, wiringSchema = {}, form = null, ...inject) {
        const callerPath = pathl.dirname(callsite()[1].getFileName());
        PrivateProperties.oprivate(this).iotManager.registerLib(callerPath + "/" + path, appId, version, wiringSchema, form, ...inject);
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
     * @param  {Object} [wiringSchema={}] A wiring schema with the following properties, e.g. : `{left:{"D1":"", "D2":""}, right:{"D3":"", "D4":""}, up:{}, down:{}}`
     * @param  {FormObject} [form=null] A form
     * @param  {...Object} inject      Some form injection parameters
     */
    registerApp(path, appId, name, version, platform, board, framework, dependencies, options = null, wiringSchema = {}, form = null, ...inject) {
        const callerPath = pathl.dirname(callsite()[1].getFileName());
        PrivateProperties.oprivate(this).iotManager.registerApp(callerPath + "/" + path, appId, name, version, platform, board, framework, dependencies, options, wiringSchema, form, ...inject);
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
     * @param  {string}   id         The iot identifier
     * @param  {string}   appId         An app identifier
     * @param  {Boolean}  [flash=false] `true` if USB flash sequence should be done after build, `false` otherwise
     * @param  {Object}   [config=null] A configuration injected to firmware
     * @param  {Function} cb            A callback `(error, result) => {}` called when firmware / flash is done. The result object contains 2 properties, `firmwarePath` for the firmware, `stdout` for the results
     */
    build(id, appId, flash = false, config = null, cb) {
        PrivateProperties.oprivate(this).iotManager.build(id, appId, flash, config, cb);
    }

    /**
     * Get the constants `constants().PLATFORMS`, `constants().BOARDS` and `constants().FRAMEWORKS`
     *
     * @returns {Object} The constants object
     */
    constants() {
        return PrivateProperties.oprivate(this).iotManager.constants();
    }

    /**
     * Retrieve IoTs (not application, but configured instance)
     *
     * @param  {string} [app=null] An IoT app identifier
     * @returns {array}    A list of IoT configuration objects
     */
    getIots(app = null) {
        return PrivateProperties.oprivate(this).iotManager.getIots(app);
    }

    /**
     * Get the global build status
     *
     * @returns {Boolean} Returns `true` if a build is already running, `false` otherwise
     */
    isBuilding() {
        return PrivateProperties.oprivate(this).iotManager.isBuilding();
    }

    /**
     * Returns the schema for a specific lib
     *
     * @param  {string} lib The lib name
     * @returns {Object}             A wiring schema object
     */
    getWiringSchemaForLib(lib) {
        return PrivateProperties.oprivate(this).iotManager.getWiringSchemaForLib(lib);
    }

    /**
     * Register an ingredient for a receipt.
     * This method will give a list of ingredients for the iot to end user
     *
     * @param  {string} iotAppOrLibKey    The app or lib key
     * @param  {string} reference   The component's reference
     * @param  {string} description The component's description
     * @param  {number} [quantity=1] The quantity
     * @param  {boolean} [isMandatory=true] `true` if component is mandatory, `false` otherwise
     * @param  {boolean} [isMain=false] `true` if component is the main component, `false` otherwise. A main component will be the component draw in the interface. Only one main component !
     */
    addIngredientForReceipe(iotAppOrLibKey, reference, description, quantity = 1, isMandatory = true, isMain = false) {
        PrivateProperties.oprivate(this).iotManager.addIngredientForReceipe(iotAppOrLibKey, reference, description, quantity, isMandatory, isMain);
    }

    /**
     * Set the upgrade URL for a specific IoT
     *
     * @param  {string} id    The iot identifier
     * @param  {string} upgradeUrl   The upgrade url
     */
    setUpgradeUrl(id, upgradeUrl) {
        PrivateProperties.oprivate(this).iotManager.setUpgradeUrl(id, upgradeUrl);
    }
}

module.exports = {class:IotAPI};
