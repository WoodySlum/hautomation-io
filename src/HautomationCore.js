"use strict";
var fs = require("fs");
var path = require("path");
var Logger = require("./logger/Logger");
var HautomationRunnerConstants = require("./../HautomationRunnerConstants");
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
var RadioManager = require("./modules/radiomanager/RadioManager");
var DeviceManager = require("./modules/devicemanager/DeviceManager");
var DbManager = require("./modules/dbmanager/DbManager");
var TranslateManager = require("./modules/translatemanager/TranslateManager");
var FormManager = require("./modules/formmanager/FormManager");
var IconFormManager = require("./forms/IconFormManager");
var DashboardManager = require("./modules/dashboardmanager/DashboardManager");
var ThemeManager = require("./modules/thememanager/ThemeManager");
var SensorsManager = require("./modules/sensorsmanager/SensorsManager");
var InstallationManager = require("./modules/installationmanager/InstallationManager");
var CoreInstaller = require("./../installer/CoreInstaller");
var MessageManager = require("./modules/messagemanager/MessageManager");

const CONFIGURATION_FILE = "data/config.json";
var AppConfiguration = require("./../data/config.json");
var NpmPackage = require("./../package.json");
const events = require("events");

// For testing only
if (process.env.TEST) {
    AppConfiguration.configurationPath = "/tmp/data/";
    AppConfiguration.db= "/tmp/data/database.db";
}

const EVENT_STOP = "stop";
const EVENT_RESTART = "restart";

/**
 * The main class for core.
 * @class
 */
class HautomationCore {
    /**
     * Constructor
     *
     * @param  {EventEmitter} runnerEventBus Runner event bus, used for restart
     * @returns {HautomationCore} The instance
     */
    constructor(runnerEventBus) {

        Logger.info("/--------------------\\");
        Logger.info("| Hautomation v" + NpmPackage.version + " |");
        Logger.info("\\--------------------/");

        this.eventBus = new events.EventEmitter();
        this.runnerEventBus = runnerEventBus;

        // Load main configuration
        this.configurationLoader();

        // Theme manager
        this.themeManager = new ThemeManager.class(AppConfiguration);

        // Translation
        this.translateManager = new TranslateManager.class(AppConfiguration.lng);
        this.translateManager.addTranslations(__dirname + "/.."); // Base translations

        // Form
        this.formManager = new FormManager.class(this.translateManager);
        // Forms
        this.IconFormManager = new IconFormManager.class(this.formManager);

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

        this.pluginsManager = null;

        // ConfManager module
        this.confManager = new ConfManager.class(AppConfiguration, this.eventBus, EVENT_STOP, this.timeEventService);

        // Alarm module
        this.alarmManager = new AlarmManager.class(this.confManager, this.webServices);
        // RadioManager. The plugins manager will be set later, when the pluginsLoaded event will be triggered
        this.radioManager = new RadioManager.class(this.pluginsManager, this.formManager, this.eventBus);
        // Sensors manager module
        this.sensorsManager = new SensorsManager.class(this.pluginsManager, this.eventBus, this.webServices, this.formManager, this.confManager, this.translateManager, this.themeManager);
        // Dashboard manager
        this.dashboardManager = new DashboardManager.class(this.themeManager, this.webServices, this.translateManager);
        // UserManager module
        this.userManager = new UserManager.class(this.confManager, this.formManager, this.webServices, this.dashboardManager);
        // Authentication module
        this.authentication = new Authentication.class(this.webServices, this.userManager);
        // Installation manager
        this.installationManager = new InstallationManager.class(this.confManager, this.eventBus);
        // Message manager
        this.messageManager = new MessageManager.class(this.pluginsManager, this.eventBus, this.userManager, this.dbManager, this.webServices, this.translateManager, this.dashboardManager);
        // Plugins manager module
        this.pluginsManager = new PluginsManager.class(this.confManager, this.webServices, this.servicesManager, this.dbManager, this.translateManager, this.formManager, this.timeEventService, this.schedulerService, this.dashboardManager, this.eventBus, this.themeManager, this.sensorsManager, this.installationManager, this.userManager, this.messageManager);
        // Device manager module
        this.deviceManager = new DeviceManager.class(this.confManager, this.formManager, this.webServices, this.radioManager, this.dashboardManager);

        // Add services to manager
        this.servicesManager.add(this.webServices);
        this.servicesManager.add(this.timeEventService);
        this.servicesManager.add(this.schedulerService);

        const self = this;
        this.eventBus.on(PluginsManager.EVENT_RESTART, () => {
            self.restart();
        });

        // Install dependencies
        if (!process.env.TEST) {
            CoreInstaller.install(this.installationManager);
        }
    }

    /**
     * Restart core
     */
    restart() {
        if (this.runnerEventBus) {
            this.runnerEventBus.emit(HautomationRunnerConstants.RESTART, {});
        } else {
            Logger.err("Could not restart (no event bus)");
        }
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

        // Install dependencies
        this.installationManager.execute();
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

        if (this.eventBus) {
            this.eventBus.emit(EVENT_STOP, {});
        }
    }

    /**
     * Try to overload configuration
     */
    configurationLoader() {
        let confPath = path.resolve() + "/" + CONFIGURATION_FILE;
        if (fs.existsSync(confPath) && !process.env.TEST) {
            Logger.info("Main configuration found, overloading");
            AppConfiguration = JSON.parse(fs.readFileSync(confPath));
        } else {
            Logger.warn("No configuration found, using default");
        }
    }
}

module.exports = {class:HautomationCore, EVENT_STOP:EVENT_STOP, EVENT_RESTART:EVENT_RESTART};
