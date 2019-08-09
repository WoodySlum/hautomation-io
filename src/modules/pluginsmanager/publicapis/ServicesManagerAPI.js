"use strict";
const PrivateProperties = require("./../PrivateProperties");
const Cleaner = require("./../../../utils/Cleaner");
const ServicesManager = require("./../../servicesmanager/ServicesManager");

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

    /**
     * Remove a service to services pool
     *
     * @param {Service} service A service
     */
    remove(service) {
        service.stop();
        PrivateProperties.oprivate(this).servicesManager.remove(service);


        let i = 0;
        let found = -1;
        this.services.forEach((s) => {
            if (s.name === service.name) {
                found = i;
            }
            i++;
        });

        if (found >= 0) {
            this.services.splice(found,1);
        }
    }

    /**
     * Stop all services
     */
    stop() {
        this.services.forEach((service) => {
            service.stop();
        });
    }

    /**
     * Start all services
     */
    start() {
        this.services.forEach((service) => {
            service.start();
        });
    }

    /**
     * Returns the threads manager
     *
     * @returns {ThreadsManager} The threads manager
     */
    getThreadsManager() {
        return PrivateProperties.oprivate(this).servicesManager.threadsManager;
    }

    /**
     * Expose a list of constants
     *
     * @returns {Object} Constants
     */
    constants() {
        return Cleaner.class.exportConstants(ServicesManager);
    }
}

module.exports = {class:ServicesManagerAPI};
