"use strict";
var Logger = require('./logger/Logger');
var WebServices = require('./services/webservices/WebServices');

class HautomationCore {
    constructor(webServices = null) {
        this.services = [];
        this.modules = [];

        // Create WebService if needed
        if (!webServices) {
            this.webServices = new WebServices();
        } else {
            this.webServices = webServices;
        }

        // Add WebService to list
        this.services.push(this.webServices);
    }

    sample(val) {
        return val;
    }


    start() {
        Logger.info('Starting core');
        this.startServices();
    }

    stop() {
        Logger.info('Stopping core');
        this.stopServices();
    }

    startServices() {
        Logger.info('Starting services');
        this.services.forEach((s)=>{
            s.start();
        });
    }

    stopServices() {
        Logger.info('Starting services');
        this.services.forEach((s)=>{
            s.stop();
        });
    }

}

module.exports = HautomationCore;
