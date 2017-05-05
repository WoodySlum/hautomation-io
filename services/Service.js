"use strict";

const STOPPED = 0;
const RUNNING = 1;

class Service {
    constructor() {
        this.status = STOPPED;
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
     * @return {int} STOPPED or RUNNING
     */
    status() {
        return this.status;
    }
}

module.exports = {Service:Service, STOPPED:STOPPED, RUNNING:RUNNING};
