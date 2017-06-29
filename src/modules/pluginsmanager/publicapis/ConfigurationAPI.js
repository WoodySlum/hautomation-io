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
    //  * @returns {ConfigurationAPI}             The instance
    //  */
    constructor(confManager, formManager, webServices, name) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).confManager = confManager;
        PrivateProperties.oprivate(this).formManager = formManager;
        PrivateProperties.oprivate(this).webServices = webServices;
        PrivateProperties.oprivate(this).name = name;
        PrivateProperties.oprivate(this).formConfiguration = null;
    }
    /* eslint-enable */

    /**
     * Register a form
     *
     * @param  {Class} formClass A form annotation's implemented class
     * @param  {...Object} inject    The injected objects
     */
    register(formClass, ...inject) {
        PrivateProperties.oprivate(this).formConfiguration = new FormConfiguration.class(
            PrivateProperties.oprivate(this).confManager,
            PrivateProperties.oprivate(this).formManager,
            PrivateProperties.oprivate(this).webServices,
            PrivateProperties.oprivate(this).name
        );
        PrivateProperties.oprivate(this).formConfiguration.registerForm(formClass, ...inject);
    }

    /**
     * Returns the configuration
     *
     * @returns {Object} Configuration object
     */
    getConfiguration() {
        return PrivateProperties.oprivate(this).formConfiguration.getConfig();
    }


}

module.exports = {class:ConfigurationAPI};
