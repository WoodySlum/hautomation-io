"use strict";

const PrivateProperties = require("./PrivateProperties");
const WebAPI = require("./publicapis/WebAPI");
const ServicesManagerAPI = require("./publicapis/ServicesManagerAPI");
const DatabaseAPI = require("./publicapis/DatabaseAPI");
const TranslateAPI = require("./publicapis/TranslateAPI");
const ConfigurationAPI = require("./publicapis/ConfigurationAPI");
const Service = require("./../../services/Service");
const DbObject = require("./../dbmanager/DbObject");
const Logger = require("./../../logger/Logger");
const FormObject = require("./../formmanager/FormObject");
const TimeEventAPI = require("./publicapis/TimeEventAPI");
const SchedulerAPI = require("./publicapis/SchedulerAPI");
const DashboardAPI = require("./publicapis/DashboardAPI");
const SensorAPI = require("./publicapis/SensorAPI");
const ThemeAPI = require("./publicapis/ThemeAPI");
const InstallerAPI = require("./publicapis/InstallerAPI");
const UserAPI = require("./publicapis/UserAPI");
const MessageAPI = require("./publicapis/MessageAPI");
const ScenarioAPI = require("./publicapis/ScenarioAPI");
const AlarmAPI = require("./publicapis/AlarmAPI");
const CameraAPI = require("./publicapis/CameraAPI");
const RadioAPI = require("./publicapis/RadioAPI");
const EnvironmentAPI = require("./publicapis/EnvironmentAPI");
const IotAPI = require("./publicapis/IotAPI");
const IotForm = require("./../iotmanager/IotForm");
const BotEngineAPI = require("./publicapis/BotEngineAPI");
const CoreAPI = require("./publicapis/CoreAPI");
const DeviceAPI = require("./publicapis/DeviceAPI");
const BackupAPI = require("./publicapis/BackupAPI");
const GatewayAPI = require("./publicapis/GatewayAPI");

const DateUtils = require("./../../utils/DateUtils");
const Icons = require("./../../utils/Icons");
const ImageUtils = require("./../../utils/ImageUtils");
const Cleaner = require("./../../utils/Cleaner");
const HautomationRunnerConstants = require("./../../../HautomationRunnerConstants");

/**
 * This class is an interface for plugins
 * @class
 */
class PluginsAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  * @param  {string} previousVersion The plugin's previous version, used for migration
    //  * @param  {object} p The plugin require value
    //  * @param  {WebServices} webServices     The web services
    //  * @param  {Object} appConfiguration The global configuration
    //  * @param  {ServicesManager} servicesManager     The services manager
    //  * @param  {DbManager} webServices     The database manager
    //  * @param  {TranslateManager} translateManager     The translate manager
    //  * @param  {FormManager} formManager     The form manager
    //  * @param  {ConfManager} confManager     The configuration manager
    //  * @param  {TimeEventService} timeEventService     The time event service
    //  * @param  {SchedulerService} schedulerService     The scheduler service
    //  * @param  {DashboardManager} dashboardManager     The dashboard manager
    //  * @param  {ThemeManager} themeManager     The theme manager
    //  * @param  {SensorsManager} sensorsManager The sensors manager
    //  * @param  {InstallationManager} installationManager The installation manager
    //  * @param  {UserManager} userManager The user manager
    //  * @param  {MessageManager} messageManager The message manager
    //  * @param  {ScenarioManager} scenarioManager The scenario manager
    //  * @param  {AlarmManager} alarmManager The alarm manager
    //  * @param  {CamerasManager} camerasManager The cameras manager
    //  * @param  {RadioManager} radioManager The radio manager
    //  * @param  {EnvironmentManager} environmentManager The environment manager
    //  * @param  {PluginsManager} pluginsManager The plugins manager
    //  * @param  {IotManager} iotManager The IoT manager
    //  * @param  {BotEngine} botEngine The IoT manager
    //  * @param  {EventEmitter} eventBus The event bus
    //  * @param  {DeviceManager} deviceManager The device manager
    //  * @param  {BackupManager} backupManager The backup manager
    //  * @param  {GatewayManager} gatewayManager The gateway manager
    //  * @param  {string} CORE_EVENT_READY The core event ready identifier
    //  * @returns {PluginAPI}                  Instance
    //  */
    constructor(previousVersion, p, webServices, appConfiguration, servicesManager, dbManager, translateManager, formManager, confManager, timeEventService, schedulerService, dashboardManager, themeManager, sensorsManager, installationManager, userManager, messageManager, scenarioManager, alarmManager, camerasManager, radioManager, environmentManager, pluginsManager, iotManager, botEngine, eventBus, deviceManager, backupManager, gatewayManager, CORE_EVENT_READY) {
        PrivateProperties.createPrivateState(this);
        this.previousVersion = previousVersion;
        this.p = p;

        PrivateProperties.oprivate(this).loadedCallback = this.p.attributes.loadedCallback;
        this.identifier = this.p.attributes.name;
        this.category = this.p.attributes.category;
        this.version = this.p.attributes.version;
        this.description = this.p.attributes.description;
        this.classes = Array.isArray(this.p.attributes.classes)?this.p.attributes.classes.slice():[];
        this.dependencies = (Array.isArray(this.p.attributes.dependencies))?this.p.attributes.dependencies.slice():[];
        this.exported = {};
        this.instance = null;
        this.CORE_EVENT_READY = CORE_EVENT_READY;

        // Export classes
        this.exported = Object.assign(this.exported,
            {Service: Service},
            {DbObject: DbObject},
            {FormObject: FormObject},
            {DateUtils: DateUtils},
            {Icons: Icons},
            {ImageUtils: ImageUtils},
            {Logger: Logger},
            {Cleaner: Cleaner},
            {cachePath:appConfiguration.cachePath},
            {IotForm:IotForm.class},
            {HautomationRunnerConstants:HautomationRunnerConstants}
        );

        // API part
        this.webAPI = new WebAPI.class(webServices);
        this.servicesManagerAPI = new ServicesManagerAPI.class(servicesManager);
        this.databaseAPI = new DatabaseAPI.class(dbManager, this.previousVersion);
        this.translateAPI = new TranslateAPI.class(translateManager);
        this.configurationAPI = new ConfigurationAPI.class(confManager, formManager, webServices, this.identifier, this.category, this);
        this.timeEventAPI = new TimeEventAPI.class(timeEventService);
        this.schedulerAPI = new SchedulerAPI.class(schedulerService);
        this.dashboardAPI = new DashboardAPI.class(dashboardManager);
        this.sensorAPI = new SensorAPI.class(formManager, this, sensorsManager);
        this.themeAPI = new ThemeAPI.class(themeManager);
        this.installerAPI = new InstallerAPI.class(installationManager, this.version);
        this.userAPI = new UserAPI.class(userManager);
        this.messageAPI = new MessageAPI.class(messageManager);
        this.scenarioAPI = new ScenarioAPI.class(scenarioManager);
        this.alarmAPI = new AlarmAPI.class(alarmManager);
        this.cameraAPI = new CameraAPI.class(formManager, this, camerasManager);
        this.radioAPI = new RadioAPI.class(radioManager);
        this.environmentAPI = new EnvironmentAPI.class(environmentManager);
        this.iotAPI = new IotAPI.class(iotManager);
        this.botEngineAPI = new BotEngineAPI.class(botEngine);
        this.coreAPI = new CoreAPI.class(eventBus, appConfiguration);
        this.deviceAPI = new DeviceAPI.class(deviceManager);
        this.backupAPI = new BackupAPI.class(backupManager);
        this.gatewayAPI = new GatewayAPI.class(gatewayManager);
        PrivateProperties.oprivate(this).pluginsManager = pluginsManager;
    }

    // /**
    //  * Loaded method
    //  */
    loaded() {
        PrivateProperties.oprivate(this).loadedCallback(this);
        Logger.info("Plugin " + this.identifier + " loaded");
    }

    // /**
    //  * Export a object with key / value containing exported classes
    //  *
    //  * @param  {Object} classes An array of classes
    //  */
    exportClasses(classes) {
        if (classes) {
            this.exported = Object.assign(classes, this.exported);
        }
    }

    /* eslint-enable */

    // Public APIs

    /**
     * Expose a class to other plugins
     *
     * @param  {class} c A class
     */
    exportClass(c) {
        this.exported[c.name] = c;
    }

    /**
     * Init APIs
     */
    init() {
        // Load translations
        this.translateAPI.load();
    }

    /**
     * Register an instance as Entry point.
     *
     * @param  {Object} i An instance
     */
    registerInstance(i) {
        this.instance = i;
    }

    /**
     * Get a plugin instance
     *
     * @param  {string} identifier A plugin identifier
     * @returns {PluginAPI}            A plugin
     */
    getPluginInstance(identifier) {
        return PrivateProperties.oprivate(this).pluginsManager.getPluginByIdentifier(identifier, true)?PrivateProperties.oprivate(this).pluginsManager.getPluginByIdentifier(identifier, true).instance:null;
    }

    /**
     * Expose a list of constants
     *
     * @returns {Object} Constants
     */
    constants() {
        return {CORE_EVENT_READY:this.CORE_EVENT_READY};
    }

    /**
     * Get plugin identifiers per gategory
     *
     * @param  {string} category A category
     * @param  {boolean} [checkInstance=true] True if return with instance, false otherwise. If set to true (default), it will check that there is an instance. False for testing is recommended.
     * @returns {Array}          An array of plugins identifiers
     */
    getPluginsIdentifiersByCategory(category, checkInstance = true) {
        const results = [];
        const plugins = PrivateProperties.oprivate(this).pluginsManager.getPluginsByCategory(category, checkInstance);
        plugins.forEach((plugin) => {
            results.push(plugin.identifier);
        });
        return results;
    }

    /**
     * Get current plugin identifier
     *
     * @returns {string} A plugin identifier
     */
    getIdentifier() {
        return this.identifier;
    }
}

module.exports = {class:PluginsAPI};
