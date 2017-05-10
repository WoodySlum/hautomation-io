"use strict";

var Logger = require("./../logger/Logger");

const STOPPED = 0;
const RUNNING = 1;

/**
 * This class should not be implemented but only inherited.
 * This class is used for services, start, stop, ...
 * @class
 */
class Service {
    /**
     * Constructor
     *
     * @returns {Service} The instance
     */
    constructor() {
        this.status = STOPPED;
        this.delegates = [];
    }

    /**
     * Start the service
     */
    start() {
        this.status = RUNNING;
    }

    /**
     * Stop the service
     */
    stop() {
        this.status = STOPPED;
    }

    /**
     * Restart the service
     */
    restart() {
        this.stop();
        this.start();
    }

    /**
     * Return the service status
     *
     * @returns {int} STOPPED or RUNNING
     */
    status() {
        return this.status;
    }

    /**
     * Register service callback
     *
     * @param  {Object} delegate The service delegate
     */
    register(delegate) {
        let i = this.delegates.indexOf(delegate);
        if (i === -1) {
            this.delegates.push(delegate);
        } else {
            Logger.warn("Delegate already registered");
        }
    }

    /**
     * Unregister service callback
     *
     * @param  {Object} delegate The service delegate
     */
    unregister(delegate) {
        let i = this.delegates.indexOf(delegate);
        if (i > -1) {
            this.delegates.splice(i, 1);
        }
    }
}

module.exports = {class:Service, STOPPED:STOPPED, RUNNING:RUNNING};
