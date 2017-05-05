"use strict";
var Logger = require("./logger/Logger");
var WebServices = require("./services/webservices/WebServices");

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

    /**
     * Start Hautomation core
     */
    start() {
        Logger.info("Starting core");
        this.startServices();
    }

    /**
     * Stop automation core
     */
    stop() {
        Logger.info("Stopping core");
        this.stopServices();
    }

    /**
     * Start all services
     */
    startServices() {
        Logger.info("Starting services");
        this.services.forEach((s)=>{
            s.start();
        });
    }

    /**
     * Stop all services
     */
    stopServices() {
        Logger.info("Stopping services");
        this.services.forEach((s)=>{
            s.stop();
        });
    }

}

module.exports = HautomationCore;
