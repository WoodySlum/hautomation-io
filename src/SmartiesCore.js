"use strict";
require("dialog-router-api");
const MAX_EVENT_BUS_LISTENER = 500;
const fs = require("fs-extra");
const path = require("path");
const Logger = require("./logger/Logger");
const ServicesManager = require("./modules/servicesmanager/ServicesManager");
const ThreadsManager = require("./modules/threadsmanager/ThreadsManager");
const WebServices = require("./services/webservices/WebServices");
const TimeEventService = require("./services/timeeventservice/TimeEventService");
const SchedulerService = require("./services/schedulerservice/SchedulerService");
const Authentication = require("./modules/authentication/Authentication");
const ConfManager = require("./modules/confmanager/ConfManager");
const UserManager = require("./modules/usermanager/UserManager");
const AlarmManager = require("./modules/alarmmanager/AlarmManager");
const PluginsManager = require("./modules/pluginsmanager/PluginsManager");
const RadioManager = require("./modules/radiomanager/RadioManager");
const DeviceManager = require("./modules/devicemanager/DeviceManager");
const DbManager = require("./modules/dbmanager/DbManager");
const TranslateManager = require("./modules/translatemanager/TranslateManager");
const FormManager = require("./modules/formmanager/FormManager");
const IconFormManager = require("./forms/IconFormManager");
const RoomFormManager = require("./forms/RoomFormManager");
const DashboardManager = require("./modules/dashboardmanager/DashboardManager");
const ThemeManager = require("./modules/thememanager/ThemeManager");
const SensorsManager = require("./modules/sensorsmanager/SensorsManager");
const CamerasManager = require("./modules/camerasmanager/CamerasManager");
const InstallationManager = require("./modules/installationmanager/InstallationManager");
const CoreInstaller = require("./../installer/CoreInstaller");
const MessageManager = require("./modules/messagemanager/MessageManager");
const ScenarioManager = require("./modules/scenariomanager/ScenarioManager");
const EnvironmentManager = require("./modules/environmentmanager/EnvironmentManager");
const IotManager = require("./modules/iotmanager/IotManager");
const GatewayManager = require("./modules/gatewaymanager/GatewayManager");
const BotEngine = require("./modules/botengine/BotEngine");
const LogManager = require("./modules/logmanager/LogManager");
const BackupManager = require("./modules/backupmanager/BackupManager");
const AiManager = require("./modules/aimanager/AiManager");
const CONFIGURATION_FILE = "data/config.json";
var AppConfiguration = {};

if (fs.existsSync("./../" + CONFIGURATION_FILE) && !process.env.TEST) {
    AppConfiguration = JSON.parse(fs.readFileSync("./../" + CONFIGURATION_FILE, "utf8"));
} else if (fs.existsSync("./" + CONFIGURATION_FILE) && !process.env.TEST) {
    AppConfiguration = JSON.parse(fs.readFileSync("./" + CONFIGURATION_FILE, "utf8"));
} else if (fs.existsSync("./../" + CONFIGURATION_FILE + ".default")) {
    AppConfiguration = JSON.parse(fs.readFileSync("./../" + CONFIGURATION_FILE + ".default", "utf8"));
} else if (fs.existsSync("./" + CONFIGURATION_FILE + ".default")) {
    AppConfiguration = JSON.parse(fs.readFileSync("./" + CONFIGURATION_FILE + ".default", "utf8"));
}

var NpmPackage = require("./../package.json");
const commit = require("../version.json").commit;
const events = require("events");

// For testing only
if (process.env.TEST) {
    AppConfiguration.configurationPath = "/tmp/data/";
    AppConfiguration.db= "/tmp/data/database.db";
}

const EVENT_STOP = "stop";
const EVENT_RESTART = "restart";
const EVENT_READY = "ready";
const EVENT_INSTALL = "install";

/**
 * The main class for core.
 * @class
 */
class SmartiesCore {
    /**
     * Constructor
     *
     * @param  {EventEmitter} runnerEventBus Runner event bus, used for restart
     * @returns {SmartiesCore} The instance
     */
    constructor(runnerEventBus) {

        Logger.info("░   __                      _   _           ");
        Logger.info("░  / _\\_ __ ___   __ _ _ __| |_(░) ___  ___ ");
        Logger.info("░  \\ \\| '_ ` _ \\ / _` | '__| __| |/ _ \\/ __|");
        Logger.info("░  _\\ \\ | | | | | (_| | |  | |_| |  __/\\__ \\");
        Logger.info("░  \\__/_| |_| |_|\\__,_|_|   \\__|_|\\___||___/");
        Logger.info("░                       Version : " + NpmPackage.version + "-" + commit);
        Logger.info(" ");

        // Create dirs if needed
        fs.ensureDirSync(AppConfiguration.configurationPath);
        fs.ensureDirSync(AppConfiguration.cachePath);


        this.runnerEventBus = runnerEventBus;
        this.eventBus = this.runnerEventBus?this.runnerEventBus:new events.EventEmitter();
        this.eventBus.setMaxListeners(MAX_EVENT_BUS_LISTENER);

        // Load main configuration
        this.configurationLoader();

        // Logger
        Logger.setLogLevel((AppConfiguration.logLevel != null && typeof AppConfiguration.logLevel != "undefined")?AppConfiguration.logLevel:null);

        // Translation
        this.translateManager = new TranslateManager.class(AppConfiguration.lng);
        this.translateManager.addTranslations(__dirname + "/.."); // Base translations
        this.sensorsManager = null;

        // Form
        this.formManager = new FormManager.class(this.translateManager);
        // Forms
        this.IconFormManager = new IconFormManager.class(this.formManager);

        // Threads
        this.threadsManager = new ThreadsManager.class();

        // Services
        // Web services and API
        this.webServices = new WebServices.class(this.translateManager, AppConfiguration.port, AppConfiguration.ssl.port, AppConfiguration.ssl.key, AppConfiguration.ssl.cert, AppConfiguration.compression, AppConfiguration.cachePath, AppConfiguration.ngrokAuthToken);

        //  Time event service
        this.timeEventService = new TimeEventService.class();

        // Init modules
        // Logs
        this.logManager = new LogManager.class(this.webServices);

        // Theme manager
        this.themeManager = new ThemeManager.class(AppConfiguration, this.webServices);

        // Db manager
        this.dbManager = new DbManager.class(AppConfiguration);

        // Scheduler service
        this.schedulerService = new SchedulerService.class(this.dbManager, this.timeEventService);

        // Services manager
        this.servicesManager = new ServicesManager.class(this.threadsManager);

        this.pluginsManager = null;

        // ConfManager module
        this.confManager = new ConfManager.class(AppConfiguration, this.eventBus, EVENT_STOP, this.timeEventService);
        // Scenario manager
        this.scenarioManager = new ScenarioManager.class(this.confManager, this.formManager, this.webServices, this.timeEventService, this.schedulerService);
        // Dashboard manager
        this.dashboardManager = new DashboardManager.class(this.themeManager, this.webServices, this.translateManager, this.confManager, this.scenarioManager);
        // Installation manager
        this.installationManager = new InstallationManager.class(this.confManager, this.eventBus, EVENT_INSTALL);
        // UserManager module
        this.userManager = new UserManager.class(this.confManager, this.formManager, this.webServices, this.dashboardManager, AppConfiguration, this.scenarioManager, this.environmentManager, this.translateManager, this.themeManager);
        // Message manager
        this.messageManager = new MessageManager.class(this.pluginsManager, this.eventBus, this.userManager, this.dbManager, this.webServices, this.translateManager, this.dashboardManager, this.scenarioManager, AppConfiguration.cachePath);
        // Environment manager
        this.environmentManager = new EnvironmentManager.class(AppConfiguration, this.confManager, this.formManager, this.webServices, this.dashboardManager, this.translateManager, this.scenarioManager, NpmPackage.version, commit, this.installationManager, this.timeEventService, this.eventBus, this.messageManager, EVENT_STOP, EVENT_READY, this.userManager);
        // Ai
        this.aiManager = new AiManager.class(AppConfiguration.configurationPath, this.eventBus, EVENT_STOP, this.timeEventService, this.environmentManager);
        // Authentication module
        this.authentication = new Authentication.class(this.webServices, this.userManager, this.environmentManager);
        // Gateway manager module
        this.gatewayManager = new GatewayManager.class(this.environmentManager, NpmPackage.version, commit, this.timeEventService, AppConfiguration, this.webServices, this.eventBus, this.scenarioManager, this.threadsManager, this.messageManager, this.translateManager, EVENT_READY, EVENT_INSTALL);
        // Cameras manager module
        this.camerasManager = new CamerasManager.class(this.pluginsManager, this.eventBus, this.webServices, this.formManager, this.confManager, this.translateManager, this.themeManager, this.dashboardManager, this.timeEventService, AppConfiguration.cameras, AppConfiguration.cachePath, this.installationManager, this.messageManager, this.gatewayManager, this.scenarioManager, this.aiManager);
        // Bot engine
        this.botEngine = new BotEngine.class(AppConfiguration, this.translateManager, this.messageManager, AppConfiguration.bot, this.installationManager, this.dashboardManager, this.themeManager, this.webServices);
        // Avoid cycle of dependencies (bots)
        this.userManager.registerBotActions(this.botEngine);

        // IoT manager
        this.iotManager = new IotManager.class(AppConfiguration, this.webServices, this.installationManager, this.formManager, this.environmentManager, this.confManager, this.translateManager, this.messageManager);
        // Sensors manager module
        this.sensorsManager = new SensorsManager.class(this.pluginsManager, this.eventBus, this.webServices, this.formManager, this.confManager, this.translateManager, this.themeManager, this.botEngine, this.timeEventService, this.scenarioManager, this.aiManager);
        // RadioManager. The plugins manager will be set later, when the pluginsLoaded event will be triggered
        this.radioManager = new RadioManager.class(this.pluginsManager, this.formManager, this.eventBus, this.scenarioManager, this.webServices, this.translateManager, this.sensorsManager);
        // Device manager module
        this.deviceManager = new DeviceManager.class(this.confManager, this.formManager, this.webServices, this.radioManager, this.dashboardManager, this.scenarioManager, this.translateManager, this.environmentManager, this.botEngine, this.sensorsManager, this.eventBus, this.dbManager, this.aiManager);
        // Alarm module
        this.alarmManager = new AlarmManager.class(this.confManager, this.formManager, this.webServices, this.dashboardManager, this.userManager, this.sensorsManager, this.translateManager, this.deviceManager, this.messageManager, this.schedulerService, this.camerasManager, this.botEngine, this.scenarioManager);
        // Backup manager
        this.backupManager = new BackupManager.class(AppConfiguration, this.confManager, this.eventBus);

        // Plugins manager module
        this.pluginsManager = new PluginsManager.class(this.confManager, this.webServices, this.servicesManager, this.dbManager, this.translateManager, this.formManager, this.timeEventService, this.schedulerService, this.dashboardManager, this.eventBus, this.themeManager, this.sensorsManager, this.installationManager, this.userManager, this.messageManager, this.scenarioManager, this.alarmManager, this.camerasManager, this.radioManager, AppConfiguration, this.environmentManager, this.iotManager, this.botEngine, this.deviceManager, this.backupManager, this.gatewayManager, this.aiManager, EVENT_READY);

        // Forms (after all initialized)
        this.RoomFormManager = new RoomFormManager.class(this.formManager, this.eventBus, EVENT_READY, this.sensorsManager, this.deviceManager, this.translateManager);

        // Add services to manager
        this.servicesManager.add(this.webServices);
        this.servicesManager.add(this.timeEventService);
        this.servicesManager.add(this.schedulerService);

        // Install dependencies
        if (!process.env.TEST) {
            if (this.eventBus) {
                this.eventBus.emit(EVENT_INSTALL, {scheduled:0, done:0});
            }
            CoreInstaller.install(this.installationManager);
        }
    }

    /**
     * Start Smarties core
     */
    start() {
        Logger.info("Starting core");
        try {
            this.servicesManager.start();
        } catch(e) {
            Logger.err("Could not start services : " + e.message);
        }

        // Install dependencies
        if (!process.env.TEST) {
            if (this.eventBus) {
                this.eventBus.emit(EVENT_INSTALL, {scheduled:0, done:0});
            }
        }
        this.installationManager.execute();
        if (this.eventBus) {
            this.eventBus.emit(EVENT_READY, {});
        }
    }

    /**
     * Stop automation core
     */
    stop() {
        // Logging
        // this.translateManager.writeList();
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

module.exports = {class:SmartiesCore, EVENT_STOP:EVENT_STOP, EVENT_RESTART:EVENT_RESTART, EVENT_READY:EVENT_READY};
