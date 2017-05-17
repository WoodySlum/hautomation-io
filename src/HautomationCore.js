"use strict";
var fs = require("fs");
var path = require("path");
var Logger = require("./logger/Logger");
var WebServices = require("./services/webservices/WebServices");
var Authentication = require("./modules/authentication/Authentication");
var ConfManager = require("./modules/confmanager/ConfManager");
var UserManager = require("./modules/usermanager/UserManager");
var AlarmManager = require("./modules/alarmmanager/AlarmManager");
var PluginsManager = require("./modules/pluginsmanager/PluginsManager");
const CONFIGURATION_FILE = "conf/config.json";
var AppConfiguration = require("./../conf/config.json");

/**
 * The main class for core.
 * @class
 */
class HautomationCore {
    /**
     * Constructor
     *
     * @returns {HautomationCore} The instance
     */
    constructor() {
        // Load main configuration
        this.configurationLoader();

        this.services = [];

        // Services
        // Web services and API
        this.webServices = new WebServices.class(AppConfiguration.port, AppConfiguration.ssl.port, AppConfiguration.ssl.key, AppConfiguration.ssl.cert);

        // Init modules
        // ConfManager module
        this.confManager = new ConfManager.class(AppConfiguration);
        // UserManager module
        this.userManager = new UserManager.class(this.confManager);
        // Authentication module
        this.authentication = new Authentication.class(this.webServices, this.userManager);
        // Alarm module
        this.alarmManager = new AlarmManager.class(this.confManager, this.webServices);
        // Plugins manager module
        this.pluginsManager = new PluginsManager.class(this.webServices);

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

    /**
     * Try to overload configuration
     */
    configurationLoader() {
        let confPath = path.resolve() + "/" + CONFIGURATION_FILE;
        if (fs.existsSync(confPath)) {
            Logger.info("Main configuration found, overloading");
            AppConfiguration = JSON.parse(fs.readFileSync(confPath));
        } else {
            Logger.warn("No configuration found, using default");
        }
    }
}

module.exports = HautomationCore;
