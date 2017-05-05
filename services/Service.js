"use strict";

const STOPPED = 0;
const RUNNING = 1;

class Service {
    constructor() {
        this.status = STOPPED;
    }

    start() {
        this.status = RUNNING;
    }

    stop() {
        this.status = STOPPED;
    }

    restart() {
        this.stop();
        this.start();
    }

    status() {
        return this.status;
    }
}

module.exports = {Service:Service, STOPPED:STOPPED, RUNNING:RUNNING};
