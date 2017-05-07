"use strict";
var Logger = require("./logger/Logger");
var WebServices = require("./services/webservices/WebServices");
var Authentication = require("./modules/authentication/Authentication");
var ConfManager = require("./modules/confmanager/ConfManager");
var UserManager = require("./modules/usermanager/UserManager");
const AppConfiguration = require("./conf/config.default.json");

var APIResponse = require("./services/webservices/APIResponse");

class HautomationCore {
    constructor(webServices = null) {
        this.services = [];

        // Create WebService if needed
        if (!webServices) {
            this.webServices = new WebServices.class();
        } else {
            this.webServices = webServices;
        }

        // Add WebService to list
        this.services.push(this.webServices);

        // Init modules
        // ConfManager module
        this.confManager = new ConfManager.class(AppConfiguration);
        // UserManager module
        this.userManager = new UserManager.class(this.confManager);
        // Authentication module
        this.authentication = new Authentication.class(this.webServices, this.userManager);
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
