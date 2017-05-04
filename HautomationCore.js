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
        this.webServices.start();
    }

}

module.exports = HautomationCore;
