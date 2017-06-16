"use strict";
var fs = require("fs");
var path = require("path");
var Logger = require("./logger/Logger");
var ServicesManager = require("./modules/servicesmanager/ServicesManager");
var ThreadsManager = require("./modules/threadsmanager/ThreadsManager");
var WebServices = require("./services/webservices/WebServices");
var Authentication = require("./modules/authentication/Authentication");
var ConfManager = require("./modules/confmanager/ConfManager");
var UserManager = require("./modules/usermanager/UserManager");
var AlarmManager = require("./modules/alarmmanager/AlarmManager");
var PluginsManager = require("./modules/pluginsmanager/PluginsManager");
var DeviceManager = require("./modules/devicemanager/DeviceManager");
var DbManager = require("./modules/dbmanager/DbManager");
const CONFIGURATION_FILE = "data/config.json";
var AppConfiguration = require("./../data/config.json");


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


        this.threadsManager = new ThreadsManager.class();

        // Services
        // Web services and API
        this.webServices = new WebServices.class(AppConfiguration.port, AppConfiguration.ssl.port, AppConfiguration.ssl.key, AppConfiguration.ssl.cert);

        // Init modules
        // Db manager
        this.dbManager = new DbManager.class(AppConfiguration);

        // Services manager
        this.servicesManager = new ServicesManager.class(this.threadsManager);

        // ConfManager module
        this.confManager = new ConfManager.class(AppConfiguration);
        // UserManager module
        this.userManager = new UserManager.class(this.confManager);
        // Authentication module
        this.authentication = new Authentication.class(this.webServices, this.userManager);
        // Alarm module
        this.alarmManager = new AlarmManager.class(this.confManager, this.webServices);
        // Plugins manager module
        this.pluginsManager = new PluginsManager.class(this.webServices, this.servicesManager);
        // Device manager module
        this.deviceManager = new DeviceManager.class(this.confManager, this.pluginsManager, this.webServices);

        // Add services to manager
        this.servicesManager.add(this.webServices);
    }

    /**
     * Start Hautomation core
     */
    start() {
        Logger.info("Starting core");
        try {
            this.servicesManager.start();
        } catch(e) {
            Logger.err("Could not start services : " + e.message);
        }
    }

    /**
     * Stop automation core
     */
    stop() {
        Logger.info("Stopping core");
        try {
            this.servicesManager.stop();
        } catch(e) {
            Logger.err("Could not stop services : " + e.message);
        }
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
