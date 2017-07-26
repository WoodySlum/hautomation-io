"use strict";
const PrivateProperties = require("./../PrivateProperties");

/**
 * Public API for sensor
 * @class
 */
class SensorAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {FormManager} formManager A form manager
    //  * @param  {PluginAPI} plugin        Plugin API
    //  * @return {SensorAPI}             The instance
    //  */
    constructor(formManager, plugin) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).formManager = formManager;
        PrivateProperties.oprivate(this).plugin = plugin;
        this.form = null;
    }
    /* eslint-enable */

    /**
     * Register a sensor form
     *
     * @param  {Class} formClass A form annotation's implemented class
     * @param  {...Object} inject    The injected objects
     */
    registerForm(formClass, ...inject) {
        this.form = formClass;
        PrivateProperties.oprivate(this).formManager.registerWithAdditionalFields(formClass,{plugin:[{ key: "Type", value: "string" },{ key: "Hidden", value: true },{ key: "Default", value: PrivateProperties.oprivate(this).plugin.identifier}]}, ...inject);
        PrivateProperties.oprivate(this).plugin.exportClass(formClass);
    }
}

module.exports = {class:SensorAPI};
