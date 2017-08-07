"use strict";

const PrivateProperties = require("./PrivateProperties");
var WebAPI = require("./publicapis/WebAPI");
var ServicesManagerAPI = require("./publicapis/ServicesManagerAPI");
var DatabaseAPI = require("./publicapis/DatabaseAPI");
var TranslateAPI = require("./publicapis/TranslateAPI");
var ConfigurationAPI = require("./publicapis/ConfigurationAPI");
var Service = require("./../../services/Service");
var DbObject = require("./../dbmanager/DbObject");
var Logger = require("./../../logger/Logger");
var FormObject = require("./../formmanager/FormObject");
var TimeEventAPI = require("./publicapis/TimeEventAPI");
var SchedulerAPI = require("./publicapis/SchedulerAPI");
var DateUtils = require("./../../utils/DateUtils");
var Icons = require("./../../utils/Icons");
var DashboardAPI = require("./publicapis/DashboardAPI");
var SensorAPI = require("./publicapis/SensorAPI");
var ThemeAPI = require("./publicapis/ThemeAPI");
var InstallerAPI = require("./publicapis/InstallerAPI");

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
    //  * @returns {PluginAPI}                  Insntance
    //  */
    constructor(previousVersion, p, webServices, servicesManager, dbManager, translateManager, formManager, confManager, timeEventService, schedulerService, dashboardManager, themeManager, sensorsManager, installationManager) {
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

        // Export classes
        this.exported = Object.assign(this.exported,
            {Service: Service},
            {DbObject: DbObject},
            {FormObject: FormObject},
            {DateUtils: DateUtils},
            {Icons: Icons},
            {Logger: Logger}
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
        this.themeManager = new ThemeAPI.class(themeManager);
        this.installerAPI = new InstallerAPI.class(installationManager, this.version);
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
}

module.exports = {class:PluginsAPI};
