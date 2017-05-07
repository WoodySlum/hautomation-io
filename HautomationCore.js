"use strict";
var Logger = require("./logger/Logger");
var WebServices = require("./services/webservices/WebServices");
var Authentication = require("./modules/authentication/Authentication.js");
const AppConfiguration = require("./conf/config.default.json");

var APIResponse = require("./services/webservices/APIResponse");

class HautomationCore {
    constructor(webServices = null) {
        this.services = [];
        this.modules = [];

        // Create WebService if needed
        if (!webServices) {
            this.webServices = new WebServices.class();
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

        // Authentication module
        this.addModule(new Authentication.class(AppConfiguration, this.webServices));

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
            s.registerAPI(this, WebServices.POST, ":/toto/titi/");
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

    /**
     * Add a module
     * @param {Object} module A module
     */
    addModule(module) {
        let a = "";
        this.modules.push(module);
    }

    // TODO:REMOVE for testing only
    processAPI(apiRequest) {
        return new Promise((resolve, reject) => {
            Logger.verbose(apiRequest);
            //let a = new APIResponse(true, {"hey":"ho"});
            resolve(new APIResponse.class(true, {"hey":"ho"}));
            //reject();
         } );
    }
}

module.exports = HautomationCore;
