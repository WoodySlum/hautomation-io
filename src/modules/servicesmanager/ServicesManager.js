"use strict";
var Logger = require("./../../logger/Logger");
var Service = require("./../../services/Service");

/**
 * This class allows to manage services
 * @class
 */
class ServicesManager {
    /**
     * Constructor
     */
    constructor() {
        this.services = [];
    }

    /**
     * Check if a service has been already registered
     *
     * @param  {Service}  service A service
     * @returns {int}   -1 if not found, else the index
     */
    isServiceRegistered(service) {
        let found = -1;
        let i = 0;
        this.services.forEach((registeredService) => {
            if (registeredService.name === service.name) {
                found = i;
            }
            i++;
        });
        return found;
    }

    /**
     * Add a service to services pool
     *
     * @param {Service} service A service
     */
    add(service) {
        if (this.isServiceRegistered(service) === -1) {
            this.services.push(service);
        } else {
            Logger.warn("Service " + service.name + " already registered");
        }
    }

    /**
     * Remove a service to services pool
     *
     * @param {Service} service A service
     */
    remove(service) {
        let index = this.isServiceRegistered(service);
        if (index >= 0) {
            this.services.splice(index, 1);
        } else {
            Logger.warn("Service " + service.name + " not registered");
        }
    }

    /**
     * Start services
     * Can potentially throw Errors
     */
    start() {
        this.services.forEach((service) => {
            service.start();
        });
    }

    /**
     * Start services
     * Can potentially throw Errors
     */
    stop() {
        this.services.forEach((service) => {
            service.stop();
        });
    }

    /**
     * Restart services
     * Can potentially throw Errors
     */
    restart() {
        this.services.forEach((service) => {
            service.restart();
        });
    }

    /**
     * Return the service from the name
     *
     * @param  {string} name Service name
     * @returns {Service}      The desired service, null if not found
     */
    getService(name) {
        let index = this.isServiceRegistered(new Service.class(name));
        if (index >= 0) {
            return this.services[index];
        } else {
            return null;
        }
    }

}

module.exports = {class:ServicesManager};
