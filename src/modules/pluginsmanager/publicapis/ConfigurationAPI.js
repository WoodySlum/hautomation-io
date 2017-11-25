"use strict";
const PrivateProperties = require("./../PrivateProperties");
const FormConfiguration = require("../../formconfiguration/FormConfiguration");

/**
 * Public API for configuration
 * @class
 */
class ConfigurationAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {ConfManager} confManager A configuration manager
    //  * @param  {FormManager} formManager A form manager
    //  * @param  {WebServices} webServices The web services instance
    //  * @param  {string} name        Plugin's name
    //  * @param  {string} category        Plugin's category
    //  * @param  {PluginAPI} plugin        Plugin API
    //  * @returns {ConfigurationAPI}             The instance
    //  */
    constructor(confManager, formManager, webServices, name, category, plugin) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).confManager = confManager;
        PrivateProperties.oprivate(this).formManager = formManager;
        PrivateProperties.oprivate(this).webServices = webServices;
        PrivateProperties.oprivate(this).name = name;
        PrivateProperties.oprivate(this).category = category;
        PrivateProperties.oprivate(this).formConfiguration = null;
        PrivateProperties.oprivate(this).plugin = plugin;
        this.form = null;

        PrivateProperties.oprivate(this).formConfiguration = new FormConfiguration.class(
            PrivateProperties.oprivate(this).confManager,
            PrivateProperties.oprivate(this).formManager,
            PrivateProperties.oprivate(this).webServices,
            PrivateProperties.oprivate(this).name
        );
    }
    /* eslint-enable */

    /**
     * Register a form
     *
     * @param  {Class} formClass A form annotation's implemented class
     * @param  {...Object} inject    The injected objects
     */
    register(formClass, ...inject) {
        PrivateProperties.oprivate(this).formConfiguration.registerForm(formClass, ...inject);
        PrivateProperties.oprivate(this).plugin.exportClass(formClass);

        if (!this.form) {
            this.form = formClass;
        }
    }

    /**
     * Returns the configuration
     *
     * @returns {Object} Configuration object
     */
    getConfiguration() {
        return PrivateProperties.oprivate(this).formConfiguration.getConfig();
    }

    /**
     * Return the formatted form object
     *
     * @returns {Object} Formatted form object
     */
    getForm() {
        if (PrivateProperties.oprivate(this).formConfiguration) {
            return PrivateProperties.oprivate(this).formConfiguration.getForm();
        } else {
            return null;
        }
    }

    /**
     * Set the update callback. Called back when delete or save action is done.
     *
     * @param {Function} cb A callback with data as parameter, e.g. `cb(data) => {}`
     */
    setUpdateCb(cb) {
        return PrivateProperties.oprivate(this).formConfiguration.updateCb = cb;
    }

}

module.exports = {class:ConfigurationAPI};
