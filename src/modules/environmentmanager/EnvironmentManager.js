"use strict";
const sha256 = require("sha256");
const os = require("os");
const fs = require("fs-extra");
const Logger = require("./../../logger/Logger");
const FormConfiguration = require("./../formconfiguration/FormConfiguration");
const EnvironmentForm = require("./EnvironmentForm");
const Tile = require("./../dashboardmanager/Tile");
const Icons = require("./../../utils/Icons");
const DayNightScenarioForm = require("./DayNightScenarioForm");
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");
const HautomationRunnerConstants = require("./../../../HautomationRunnerConstants");
const ROUTE_APP_ENVIRONMENT_INFORMATION = "/environment/app/get/";
const ROUTE_APP_SET_CONFIGURATION = "/environment/conf/set/";
const ROUTE_APP_GET_CONFIGURATION = "/environment/conf/get/";
const MAIN_CONFIG_PATH = "./data/config.json";

/**
 * This class allows to manage house environment
 * @class
 */
class EnvironmentManager {
    /**
     * Constructor
     *
     * @param  {AppConfiguration} appConfiguration The app configuration object
     * @param  {ConfManager} confManager  A configuration manager
     * @param  {FormManager} formManager  A form manager
     * @param  {WebServices} webServices  The web services
     * @param  {DashboardManager} dashboardManager The dashboard manager
     * @param  {TranslateManager} translateManager    The translate manager
     * @param  {ScenarioManager} scenarioManager    The scenario manager
     * @param  {string} version    The app version
     * @param  {string} hash    The app hash
     * @param  {InstallationManager} installationManager    The installation manager
     * @param  {TimeEventService} timeEventService    The time event service
     * @param  {EventEmitter} eventBus    The global event bus
     *
     * @returns {EnvironmentManager}              The instance
     */
    constructor(appConfiguration, confManager, formManager, webServices, dashboardManager, translateManager, scenarioManager, version, hash, installationManager, timeEventService, eventBus) {
        this.appConfiguration = appConfiguration;
        this.formConfiguration = new FormConfiguration.class(confManager, formManager, webServices, "environment", false, EnvironmentForm.class);
        this.dashboardManager = dashboardManager;
        this.formManager = formManager;
        this.translateManager = translateManager;
        this.scenarioManager = scenarioManager;
        this.eventBus = eventBus;
        this.formConfiguration.data = this.formConfiguration.data?this.formConfiguration.data:{};
        this.registeredElements = {};
        this.registerTile();
        this.formManager.register(DayNightScenarioForm.class);
        this.scenarioManager.register(DayNightScenarioForm.class, null, "daynight.scenario.trigger.title");
        this.version = version;
        this.hash = hash;
        this.installationManager = installationManager;
        this.timeEventService = timeEventService;
        webServices.registerAPI(this, WebServices.GET, ":" + ROUTE_APP_ENVIRONMENT_INFORMATION, Authentication.AUTH_USAGE_LEVEL);
        webServices.registerAPI(this, WebServices.POST, ":" + ROUTE_APP_SET_CONFIGURATION, Authentication.AUTH_ADMIN_LEVEL);
        webServices.registerAPI(this, WebServices.GET, ":" + ROUTE_APP_GET_CONFIGURATION, Authentication.AUTH_ADMIN_LEVEL);

        this.timeEventService.register((self) => {
            self.updateCore();
        }, this, TimeEventService.EVERY_DAYS);
    }

    /**
     * Register for day/night notifications
     *
     * @param  {Function} cb            A callback triggered when day/night information is received. Example : `(isNight) => {}`
     * @param  {string} id            An identifier
     */
    registerDayNightNotifications(cb, id = null) {
        const index = sha256(cb.toString() + id);
        this.registeredElements[index] = cb;
    }

    /**
     * Unegister for day/night notifications
     *
     * @param  {Function} cb             A callback triggered when day/night information is received. Example : `(isNight) => {}`
     * @param  {string} id            An identifier
     */
    unregisterDayNightNotifications(cb, id = null) {
        const index = sha256(cb.toString() + id);
        if (this.registeredElements[index]) {
            delete this.registeredElements[index];
        } else {
            Logger.warn("Element not found");
        }
    }

    /**
     * Register day / night tile
     */
    registerTile() {
        let tileTitle = this.translateManager.t("environment.day");
        let icon = "sun-1";
        if (this.isNight()) {
            tileTitle = this.translateManager.t("environment.night");
            icon = "moon";
        }
        const tile = new Tile.class(this.dashboardManager.themeManager, "day-night", Tile.TILE_INFO_ONE_TEXT, Icons.class.list()[icon], null, tileTitle, null, null, null, null, 200);
        this.dashboardManager.registerTile(tile);
    }

    /**
     * Return the home's coordinates
     *
     * @returns {Object} The coordinates
     */
    getCoordinates() {
        return this.appConfiguration.home;
    }

    /**
     * Dispatch day or night changes
     */
    dispatchDayNightChange() {
        // Dispatch callback
        Object.keys(this.registeredElements).forEach((registeredKey) => {
            this.registeredElements[registeredKey](this.isNight());
        });

        // Dispatch to scenarios
        this.scenarioManager.getScenarios().forEach((scenario) => {
            if (scenario.DayNightScenarioForm && scenario.DayNightScenarioForm.day && !this.isNight()) {
                this.scenarioManager.triggerScenario(scenario);
            }

            if (scenario.DayNightScenarioForm && scenario.DayNightScenarioForm.night && this.isNight()) {
                this.scenarioManager.triggerScenario(scenario);
            }
        });
    }

    /**
     * Set day
     */
    setDay() {
        if (this.isNight()) {
            Logger.info("Day mode enabled");
            this.formConfiguration.data.day = true;
            this.formConfiguration.save();
            this.registerTile();

            this.dispatchDayNightChange();
        }
    }

    /**
     * Set night
     */
    setNight() {
        if (!this.isNight()) {
            Logger.info("Night mode enabled");
            this.formConfiguration.data.day = false;
            this.formConfiguration.save();
            this.registerTile();

            this.dispatchDayNightChange();
        }
    }

    /**
     * Is it night ?
     *
     * @returns {boolean} `true` if night mode, otherwise `false`
     */
    isNight() {
        return !this.formConfiguration.data.day;
    }

    /**
     * Get the local HTTP port
     *
     * @returns {number} The local hautomation HTTP port
     */
    getLocalPort() {
        return this.appConfiguration.port;
    }

    /**
     * Get the local IP address, null if not found
     *
     * @returns {string} The local IP address
     */
    getLocalIp() {
        const ifaces = os.networkInterfaces();
        let localIp = null;
        Object.keys(ifaces).forEach(function (ifname) {
            ifaces[ifname].forEach(function (iface) {
                if ("IPv4" !== iface.family || iface.internal !== false) {
                    // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                    return;
                }

                localIp = iface.address;
            });
        });

        return localIp;
    }

    /**
     * Get the mac address
     *
     * @returns {string} The mac address, or `null` if not found
     */
    getMacAddress() {
        const ifaces = os.networkInterfaces();
        let macAddress = null;
        Object.keys(ifaces).forEach(function (ifname) {
            ifaces[ifname].forEach(function (iface) {
                if ("IPv4" !== iface.family || iface.internal !== false) {
                    // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                    return;
                }

                macAddress = iface.mac;
            });
        });

        return macAddress;
    }

    /**
     * Get the local API Url
     *
     * @returns {string} The local API url (e.g. : http://192.168.2.34:8100/api/)
     */
    getLocalAPIUrl() {
        return "http://" + this.getLocalIp() + ":" + this.getLocalPort() + WebServices.ENDPOINT_API;
    }

    /**
     * Save the main configuration. This method throw an error if something wrong occurs.
     *
     * @param  {Object} data The configuration data to be updated
     */
    saveMainConfiguration(data) {
        const mainConfiguration = this.appConfiguration;
        // Admin part
        if (data.admin) {
            if (data.admin.username) {
                mainConfiguration.admin.username = data.admin.username;
            }

            if (data.admin.password) {
                if (data.admin.password.length >= 8) {
                    mainConfiguration.admin.password = data.admin.password;
                } else {
                    throw Error("Admin password is too short (8 characters minimum)");
                }
            }
        }

        // Cameras part
        if (data.cameras) {
            mainConfiguration.cameras.history = data.cameras.history;
            mainConfiguration.cameras.season = data.cameras.season;
            mainConfiguration.cameras.timelapse = data.cameras.timelapse;
        }

        // Lng part
        if (data.lng) {
            if (data.lng.length === 2) {
                mainConfiguration.lng = data.lng;
            } else {
                throw Error("Invalid language");
            }
        }

        // Home part
        if (data.home) {
            if (data.home.longitude) {
                mainConfiguration.home.longitude = parseFloat(data.home.longitude);
            } else {
                throw Error("Missing home longitude");
            }

            if (data.home.latitude) {
                mainConfiguration.home.latitude = parseFloat(data.home.latitude);
            } else {
                throw Error("Missing home latitude");
            }

            if (data.home.radius) {
                mainConfiguration.home.radius = parseFloat(data.home.radius);
            } else {
                throw Error("Missing home radius");
            }
        }

        // Bot part
        if (data.bot) {
            if (typeof data.bot.enable === "boolean") {
                mainConfiguration.bot.enable = data.bot.enable;
            }

            if (data.bot.sensitivity) {
                mainConfiguration.bot.sensitivity = parseFloat(data.bot.sensitivity);
            } else {
                throw Error("Missing bot sensitivity");
            }

            if (data.bot.audioGain) {
                mainConfiguration.bot.audioGain = parseFloat(data.bot.audioGain);
            } else {
                throw Error("Missing bot audio gain");
            }

            if (data.bot.outputVolume) {
                mainConfiguration.bot.outputVolume = parseFloat(data.bot.outputVolume);
            } else {
                throw Error("Missing bot output volume");
            }
        }

        // Debbugging part
        if (Number.isInteger(data.logLevel)) {
            mainConfiguration.logLevel = parseInt(data.logLevel);
        }

        if (typeof data.crashOnPluginError === "boolean") {
            mainConfiguration.crashOnPluginError = Boolean(data.crashOnPluginError);
        }

        mainConfiguration.defaultConfig = false;

        Logger.info("Writing main configuration data");
        fs.writeFileSync(MAIN_CONFIG_PATH, JSON.stringify(mainConfiguration, null, "    "));

        // Restart
        setTimeout((self) => {
            self.eventBus.emit(HautomationRunnerConstants.RESTART);
        }, 2000, this);
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        if (apiRequest.route.startsWith( ":" + ROUTE_APP_ENVIRONMENT_INFORMATION)) {
            return new Promise((resolve) => {
                resolve(new APIResponse.class(true, {version:this.version, hash:this.hash, hautomationId: this.getHautomationId()}));
            });
        } else if (apiRequest.route === ":" + ROUTE_APP_SET_CONFIGURATION) {
            return new Promise((resolve, reject) => {
                try {
                    this.saveMainConfiguration(apiRequest.data);
                    resolve(new APIResponse.class(true, {successs: true}));
                } catch(e) {
                    reject(new APIResponse.class(false, {}, 4512, e.message));
                }
            });
        } else if (apiRequest.route === ":" + ROUTE_APP_GET_CONFIGURATION) {
            return new Promise((resolve) => {
                resolve(new APIResponse.class(true, this.appConfiguration));
            });
        }
    }

    /**
     * Try to update core
     */
    updateCore() {
        // For apt linux
        if (os.platform() === "linux") {
            const updateFile = this.appConfiguration.cachePath + "update.sh";
            fs.removeSync(updateFile);
            fs.writeFileSync(updateFile, "#!/bin/sh\nsudo apt-get update\nsudo apt-get install hautomation\n");
            fs.chmodSync(updateFile, "0770");

            Logger.info("Trying to upgrade core from version " +  this.version + "-" + this.hash + "...");

            this.installationManager.executeCommand("at now +1 minutes -f " + updateFile , false, (error, stdout, stderr) => {
                if (error) {
                    Logger.err(error);
                    Logger.err(stderr);
                } else {
                    Logger.info(stdout);
                }
            });
        }
    }

    /**
     * Check if this is the default configuration exposed
     *
     * @returns {boolean} `true` if this is the default config, `false` otherwise
     */
    isDefaultConfig() {
        return this.appConfiguration.defaultConfig;
    }

    /**
     * Returns the hautomation ID
     *
     * @returns {string} Hautomation identifier
     */
    getHautomationId() {
        const macAddress = this.getMacAddress();
        if (macAddress) {
            return sha256(macAddress).substr(0,4);
        }

        return macAddress;
    }

    /**
     * Returns the full hautomation ID
     *
     * @returns {string} Hautomation full identifier
     */
    getFullHautomationId() {
        const macAddress = this.getMacAddress();
        if (macAddress) {
            return sha256(macAddress);
        }

        return macAddress;
    }
}

module.exports = {class:EnvironmentManager};
