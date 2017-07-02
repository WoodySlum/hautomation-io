"use strict";
var fs = require("fs");
var path = require("path");
var Logger = require("./logger/Logger");
var ServicesManager = require("./modules/servicesmanager/ServicesManager");
var ThreadsManager = require("./modules/threadsmanager/ThreadsManager");
var WebServices = require("./services/webservices/WebServices");
var TimeEventService = require("./services/timeeventservice/TimeEventService");
var SchedulerService = require("./services/schedulerservice/SchedulerService");
var Authentication = require("./modules/authentication/Authentication");
var ConfManager = require("./modules/confmanager/ConfManager");
var UserManager = require("./modules/usermanager/UserManager");
var AlarmManager = require("./modules/alarmmanager/AlarmManager");
var PluginsManager = require("./modules/pluginsmanager/PluginsManager");
var DeviceManager = require("./modules/devicemanager/DeviceManager");
var DbManager = require("./modules/dbmanager/DbManager");
var TranslateManager = require("./modules/translatemanager/TranslateManager");
var FormManager = require("./modules/formmanager/FormManager");
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

        // Translation
        this.translateManager = new TranslateManager.class(AppConfiguration.lng);
        this.translateManager.addTranslations(__dirname + "/.."); // Base translations

        // Form
        this.formManager = new FormManager.class(this.translateManager);

        // Threads
        this.threadsManager = new ThreadsManager.class();

        // Services
        // Web services and API
        this.webServices = new WebServices.class(AppConfiguration.port, AppConfiguration.ssl.port, AppConfiguration.ssl.key, AppConfiguration.ssl.cert);

        //  Time event service
        this.timeEventService = new TimeEventService.class();

        // Init modules
        // Db manager
        this.dbManager = new DbManager.class(AppConfiguration);

        // Scheduler service
        this.schedulerService = new SchedulerService.class(this.dbManager, this.timeEventService);

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
        this.pluginsManager = new PluginsManager.class(this.confManager, this.webServices, this.servicesManager, this.dbManager, this.translateManager, this.formManager, this.timeEventService, this.schedulerService);
        // Device manager module
        this.deviceManager = new DeviceManager.class(this.confManager, this.pluginsManager, this.webServices);

        // Add services to manager
        this.servicesManager.add(this.webServices);
        this.servicesManager.add(this.timeEventService);
        this.servicesManager.add(this.schedulerService);
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
            this.dbManager.close();
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
