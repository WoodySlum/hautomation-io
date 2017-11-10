"use strict";
const PrivateProperties = require("./../PrivateProperties");

/**
 * Public API for services manager
 * @class
 */
class ServicesManagerAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {ServicesManager} servicesManager The services manager API
    //  * @return {ServicesManagerAPI}             The instance
    //  */
    constructor(servicesManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).servicesManager = servicesManager;
        this.services = [];
    }
    /* eslint-enable */

    /**
     * Add a service
     *
     * @param {Service} service The service
     */
    add(service) {
        PrivateProperties.oprivate(this).servicesManager.add(service);
        this.services.push(service);
    }

}

module.exports = {class:ServicesManagerAPI};
