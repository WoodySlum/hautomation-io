"use strict";
var fs = require("fs");
var path = require("path");
var remi = require("remi");
var remiRunner = require("remi-runner");
var toposort = require("toposort");

var Logger = require("./../../logger/Logger");
var PluginAPI = require("./PluginAPI");
var PluginConf = require("./PluginConf");
var Authentication = require("./../authentication/Authentication");
var WebServices = require("./../../services/webservices/WebServices");
var APIResponse = require("./../../services/webservices/APIResponse");
var HautomationRunnerConstants = require("./../../../HautomationRunnerConstants");

const CONF_KEY = "plugins";
const EVENT_LOADED = "pluginLoaded";

const INTERNAL_PLUGIN_PATH = "./../../internal-plugins/";
const EXTERNAL_PLUGIN_PATH = "plugins/";
const PLUGIN_PREFIX = "";
const PLUGIN_MAIN = "plugin.js";
const ROUTE_WS_GET = ":/plugins/get/";
const ROUTE_WS_ENABLE_SET_BASE = ":/plugins/enable/";
const ROUTE_WS_ENABLE_SET = ROUTE_WS_ENABLE_SET_BASE + "[plugin]/[status]/";
const ROUTE_WS_GENERAL_ENABLE_SET = ":/plugins/general/enable/";

const ERROR_MISSING_PROPERTY = "Missing property name, version or description for plugin";
const ERROR_NOT_A_FUNCTION = "Missing plugin class";
const ERROR_DEPENDENCY_NOT_FOUND = "Dependency not found";
const ERROR_DISABLE_CORE_PLUGIN = "Cannot disable core plugin";

const INTERNAL_PLUGINS = [
    "rflink",
    "radio",
    "sensor",
    "temperature-sensor",
    "humidity-sensor",
    "throughput-sensor",
    "pressure-sensor",
    "wind-sensor",
    "esp-temperature-sensor",
    "esp-humidity-sensor",
    "message-provider",
    "prowl",
    "camera",
    "sumpple",
    "presence-sensor",
    "radio-presence-sensor",
    "openweather",
    "openweather-temperature-sensor",
    "openweather-humidity-sensor",
    "openweather-pressure-sensor",
    "openweather-wind-sensor",
    "esp8266",
    "esp8266-dht22",
    "trash-reminder",
    "sms",
    "electric-sensor",
    "enedis-linky-electric-sensor",
    "esp8266-weather-station",
    "esp-pressure-sensor",
    "reboot",
    "rain-time-sensor",
    "esp-rain-time-sensor",
    "generic-throughput-sensor",
    "ring-alert",
    "homebridge",
    "generic-camera",
    "tl-mr6400-fairuse-sensor",
    "fairuse-sensor",
    "tplink-tl-mr6400",
    "huawei-router",
    "huawei-fairuse-sensor",
    "hue",
    "dropbox",
    "tuya-device",
    "ping-sensor",
    "smoke-sensor",
    "radio-smoke-sensor",
    "pushme",
    "signal-db-sensor",
    "huawei-signal-db-sensor",
    "ifttt",
    "presence-simulator",
    "tv",
    "philips-tv",
    "percent-sensor",
    "cpu-usage-sensor",
    "ram-usage-sensor",
    "rom-usage-sensor",
    "esp8266-roomba",
    "http-presence-sensor",
    "esp8266-soil-hygrometer",
    "esp-plant-sensor",
    "deconz",
    "water-plant-alert",
    "plant-sensor",
    "huawei-router-sms",
    "light-sensor",
    "radio-light-sensor",
    "radio-temperature-sensor",
    "radio-humidity-sensor",
    "radio-pressure-sensor",
    "radio-contact-sensor",
    "contact-sensor"
];

const CORE_PLUGINS = [
    "radio",
    "sensor",
    "temperature-sensor",
    "humidity-sensor",
    "throughput-sensor",
    "pressure-sensor",
    "wind-sensor",
    "message-provider",
    "camera",
    "presence-sensor",
    "radio-presence-sensor",
    "electric-sensor",
    "rain-time-sensor",
    "fairuse-sensor",
    "smoke-sensor",
    "signal-db-sensor",
    "tv",
    "percent-sensor",
    "plant-sensor",
    "light-sensor",
    "radio-light-sensor",
    "radio-temperature-sensor",
    "radio-humidity-sensor",
    "radio-pressure-sensor",
    "radio-contact-sensor",
    "contact-sensor"
];

/**
 * This class manage plugins
 * @class
 */
class PluginsManager {
    /**
     * Constructor
     *
     * @param  {ConfManager} confManager     The configuration manager
     * @param  {WebServices} webServices     The web services
     * @param  {ServicesManager} servicesManager     The services manager
     * @param  {DbManager} dbManager     The database manager
     * @param  {TranslateManager} translateManager     The translate manager
     * @param  {FormManager} formManager     The form manager
     * @param {TimeEventService} timeEventService The time event service
     * @param {SchedulerService} schedulerService The scheduler service
     * @param  {DashboardManager} dashboardManager    The dashboard manager
     * @param  {EventEmitter} eventBus    The global event bus
     * @param  {ThemeManager} themeManager    The theme manager
     * @param {SensorsManager} sensorsManager  The sensors manager
     * @param {InstallationManager} installationManager  The installation manager
     * @param {UserManager} userManager  The user manager
     * @param {MessageManager} messageManager  The message manager
     * @param  {ScenarioManager} scenarioManager The scenario manager
     * @param  {AlarmManager} alarmManager The alarm manager
     * @param  {CamerasManager} camerasManager The cameras manager
     * @param  {RadioManager} radioManager The radio manager
     * @param  {Object} appConfiguration The global configuration
     * @param  {EnvironmentManager} environmentManager The environment manager
     * @param  {IotManager} iotManager The IoT manager
     * @param  {BotEngine} botEngine The bot engine
     * @param  {DeviceManager} deviceManager The device manager
     * @param  {BackupManager} backupManager The backup manager
     * @param  {GatewayManager} gatewayManager The gateway manager
     * @param  {string} CORE_EVENT_READY The core event ready identifier
     * @returns {PluginsManager} The instance
     */
    constructor(confManager, webServices, servicesManager, dbManager, translateManager, formManager, timeEventService, schedulerService, dashboardManager, eventBus, themeManager, sensorsManager, installationManager, userManager, messageManager, scenarioManager, alarmManager, camerasManager, radioManager, appConfiguration, environmentManager, iotManager, botEngine, deviceManager, backupManager, gatewayManager, CORE_EVENT_READY) {
        this.fs = fs;
        this.path = path;
        this.remi = remi;

        this.webServices = webServices;
        this.servicesManager = servicesManager;
        this.confManager = confManager;
        this.dbManager = dbManager;
        this.translateManager = translateManager;
        this.formManager = formManager;
        this.timeEventService = timeEventService;
        this.schedulerService = schedulerService;
        this.dashboardManager = dashboardManager;
        this.eventBus = eventBus;
        this.themeManager = themeManager;
        this.sensorsManager = sensorsManager;
        this.installationManager = installationManager;
        this.userManager = userManager;
        this.messageManager = messageManager;
        this.scenarioManager = scenarioManager;
        this.alarmManager = alarmManager;
        this.camerasManager = camerasManager;
        this.radioManager = radioManager;
        this.appConfiguration = appConfiguration;
        this.environmentManager = environmentManager;
        this.iotManager = iotManager;
        this.botEngine = botEngine;
        this.deviceManager = deviceManager;
        this.backupManager = backupManager;
        this.gatewayManager = gatewayManager;
        this.CORE_EVENT_READY = CORE_EVENT_READY;

        this.plugins = [];
        try {
            this.pluginsConf = this.confManager.loadData(PluginConf.class, CONF_KEY);
        } catch(e) {
            this.pluginsConf = [];
        }

        this.load();
        // Dispatch event
        if (this.eventBus) {
            this.eventBus.emit(EVENT_LOADED, this);
        }

        // Register plugins WS
        this.webServices.registerAPI(this, WebServices.GET, ROUTE_WS_GET, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, ROUTE_WS_ENABLE_SET, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, ROUTE_WS_GENERAL_ENABLE_SET, Authentication.AUTH_ADMIN_LEVEL);
    }

    /**
     * Get plugins from external directory
     *
     * @param  {string} srcPath A source path
     * @returns {[string]}         An array of plugins where prefix is well set as descripbed in PLUGIN_PREFIX
     */
    getPluginsFromDirectory(srcPath) {
        if (this.fs.existsSync(srcPath)) {
            return this.fs.readdirSync(srcPath)
                .filter(file => this.fs.lstatSync(this.path.join(srcPath, file)).isDirectory())
                .filter(function(file) {
                    return (file.substr(0, PLUGIN_PREFIX.length) === PLUGIN_PREFIX);
                });
        } else {
            return [];
        }
    }

    /**
     * Check plugin sanity. A plugin should have name, version and description properties and a function as entry point
     *
     * @param  {Object} p A plugin object as set in require. This method throws errors
     * @param  {[PluginAPI]} [plugins=[]] plugins The plugin API array
     */
    checkPluginSanity(p, plugins = []) {
        // Global sanity check
        if (!p.attributes.loadedCallback || !p.attributes.name || !p.attributes.version || !p.attributes.description || !p.attributes.category) {
            throw Error(ERROR_MISSING_PROPERTY);
        } else if(typeof p.attributes.loadedCallback !== "function") {
            throw Error(ERROR_NOT_A_FUNCTION);
        }

        // Check for dependencies
        if (p.attributes.dependencies && p.attributes.dependencies.length > 0) {
            p.attributes.dependencies.forEach((pluginIdentifier) => {
                let found = false;
                plugins.forEach((plugin) => {
                    if (plugin.identifier === pluginIdentifier) {
                        found = true;
                    }
                });

                if (!found) {
                    Logger.err("Unloaded depedency : " + pluginIdentifier);
                    throw Error(ERROR_DEPENDENCY_NOT_FOUND);
                }
            });
        }

    }

    /**
     * Init plugin by doing a require and create a Plugin API object for each registered needed plugins
     *
     * @param  {string}  plugin           The plugin
     * @param  {string}  path             Plugins path
     * @param  {boolean} [relative=false] True if path is relative, else false
     * @returns {PluginAPI}             Returns an array of plugins API
     */
    initPlugin(plugin, path, relative) {
        let item = null;
        if (plugin) {
            let pluginPath = relative ? path + plugin +"/" + PLUGIN_MAIN : this.path.resolve() + "/" + path + plugin +"/" + PLUGIN_MAIN;
            Logger.verbose("Loading plugin at path : " + pluginPath);
            let p = require(pluginPath, "may-exclude");

            // Save configuration meta data
            const existingPluginConf = this.getPluginConf(p.attributes.name);
            // p.attributes.defaultDisabled && !process.env.TEST => Tests should cover all plugins
            const pluginConf = new PluginConf.class(path, relative, p.attributes.name, p.attributes.version, (CORE_PLUGINS.indexOf(p.attributes.name) > -1)?true:(existingPluginConf?existingPluginConf.enable:((p.attributes.defaultDisabled && !process.env.TEST) ? false : null)), p.attributes.dependencies);

            this.confManager.setData(CONF_KEY, pluginConf, this.pluginsConf, PluginConf.comparator);

            // Send old version for migration
            let oldVersion = "0.0.0";
            if (pluginConf && pluginConf.version) {
                oldVersion = pluginConf.version;
            }

            let pApi = new PluginAPI.class(
                oldVersion,
                p,
                this.webServices,
                this.appConfiguration,
                this.servicesManager,
                this.dbManager,
                this.translateManager,
                this.formManager,
                this.confManager,
                this.timeEventService,
                this.schedulerService,
                this.dashboardManager,
                this.themeManager,
                this.sensorsManager,
                this.installationManager,
                this.userManager,
                this.messageManager,
                this.scenarioManager,
                this.alarmManager,
                this.camerasManager,
                this.radioManager,
                this.environmentManager,
                this,
                this.iotManager,
                this.botEngine,
                this.eventBus,
                this.deviceManager,
                this.backupManager,
                this.gatewayManager,
                this.CORE_EVENT_READY
            );

            item = pApi;
        }

        return item;
    }


    /**
     * Init plugins by doing a require and create a Plugin API object for each registered needed plugins
     *
     * @param  {string}  path             Plugins path
     * @param  {[string]}  plugins        An array of plugins name
     * @param  {boolean} [relative=false] True if path is relative, else false
     * @returns {[PluginAPI]}             Returns an array of plugins API
     */
    initPlugins(path, plugins, relative = false) {
        let initializedPlugins = [];

        plugins.forEach((plugin) => {
            let pApi = this.initPlugin(plugin, path, relative);
            if (pApi) {
                initializedPlugins.push(pApi);
            }
        });

        return initializedPlugins;
    }

    /**
     * Register plugins with remi lib
     *
     * @param  {[PluginAPI]} plugins The list of PluginAPI correctly sorted
     * @returns {[PluginAPI]}         The plugin list identical as input, but without elements not sanitized
     */
    registerPlugins(plugins) {
        let registeredPlugins = [];

        plugins.forEach((plugin) => {
            let registrator = this.remi(plugin);
            registrator.hook(remiRunner());

            try {
                this.checkPluginSanity(plugin.p, plugins);
                registrator.register(plugin.p).catch(() => {
                    //Logger.err(e.message);
                });
                registeredPlugins.push(plugin);
            } catch(e) {
                Logger.err(e.message + " (" + plugin.identifier + ")");
            }
        });

        return registeredPlugins;
    }

    /**
     * Load all plugins (internal and external)
     */
    load() {
        let initializedPlugins = [];

        initializedPlugins = initializedPlugins.concat(this.initPlugins(INTERNAL_PLUGIN_PATH, INTERNAL_PLUGINS, true));
        initializedPlugins = initializedPlugins.concat(this.initPlugins(EXTERNAL_PLUGIN_PATH, this.getPluginsFromDirectory(EXTERNAL_PLUGIN_PATH)));

        // Sort loading per dependencies
        let toposortArray = this.prepareToposortArray(initializedPlugins);
        let toposortedArray = this.toposort(toposortArray);
        let toposortedPlugins = this.topsortedArrayConverter(toposortedArray, initializedPlugins);

        // Load plugins
        this.plugins = this.registerPlugins(toposortedPlugins);

        // Consolidate classes
        let classes = {};
        this.plugins.forEach((plugin) => {
            plugin.classes.forEach((c) => {
                classes[c.name] = c;
            });
        });

        // Load event
        this.plugins.forEach((plugin) => {
            Logger.verbose("Loading plugin " + plugin.identifier);
            plugin.exportClasses(classes);

            const pluginConf = this.getPluginConf(plugin.identifier);

            // Load
            try {
                if (!pluginConf || (pluginConf && pluginConf.enable) || (CORE_PLUGINS.indexOf(pluginConf.identifier) > -1)) {
                    plugin.loaded();
                } else {
                    Logger.info("Plugin " + pluginConf.identifier + " has been disabled and won't be loaded");
                }

                // Reload exported
                classes = plugin.exported;
            } catch(e) {
                Logger.err("Plugin " + plugin.identifier + " crashed : " + e.message);
                Logger.err(e.stack);
                if (this.appConfiguration && this.appConfiguration.crashOnPluginError) {
                    process.exit(1);
                }
            }
        });
    }

    /**
     * Get plugin per category
     *
     * @param  {string} category A category
     * @param  {boolean} [checkInstance=true] True if return with instance, false otherwise. If set to true (default), it will check that there is an instance. False for testing is recommended.
     * @returns {Array}          An array of plugins
     */
    getPluginsByCategory(category, checkInstance = true) {
        let plugins = [];
        this.plugins.forEach((plugin) => {
            if (plugin.category.toLowerCase() === category.toLowerCase() && (!checkInstance || (checkInstance && plugin.instance))) {
                plugins.push(plugin);
            }
        });

        return plugins;
    }

    /**
     * Get a plugin with identifier
     *
     * @param  {string} identifier A plugin identifier
     * @param  {boolean} [checkInstance=true] True if return with instance, false otherwise. If set to true (default), it will check that there is an instance. False for testing is recommended.
     * @returns {PluginAPI}            A plugin
     */
    getPluginByIdentifier(identifier, checkInstance = true) {
        let p = null;
        this.plugins.forEach((plugin) => {
            if (plugin.identifier.toLowerCase() === identifier.toLowerCase() && (!checkInstance || (checkInstance && plugin.instance))) {
                p = plugin;
                return;
            }
        });

        return p;
    }

    /**
     * Is the plugin enabled
     *
     * @param  {string}  pluginIdentifier The plugin identifier
     * @returns {boolean}                  `true` if enabled, `false` otherwise
     */
    isEnabled(pluginIdentifier) {
        const pluginConf = this.getPluginConf(pluginIdentifier);
        return ((pluginConf && pluginConf.enable) || (CORE_PLUGINS.indexOf(pluginIdentifier) > -1))?true:false;
    }


    /*
     * Toposort
     */

    /**
     * Return a table prepared for toposort, with dependencies
     *
     * @param  {[PluginAPI]} plugins A list of PluginAPI objects
     * @returns {[array]}         An array ready to be sorted, e.g. [["a", "b"], ["b"], ["c"]]
     */
    prepareToposortArray(plugins) {
        let toposortArray = [];
        plugins.forEach((plugin) => {
            let dependencies = Array.isArray(plugin.dependencies)?plugin.dependencies.slice():[];
            dependencies.unshift(plugin.identifier);
            toposortArray.push(dependencies);
        });

        return toposortArray;
    }

    /**
     * Toposort the array
     *
     * @param  {[array]} toposortArray A toposort prepared array, processed previously in prepareToposortArray(). All undefined elements will be removed.
     * @returns {[string]}               A toposorted array, sorted with dependencies
     */
    toposort(toposortArray) {
        return toposort(toposortArray).reverse().filter((element) => {
            return element !== undefined;
        });
    }

    /**
     * Re-create a correctly sorted array of plugins with the previous toposort order
     *
     * @param  {[string]} toposortedArray A toposorted array, build with toposort()
     * @param  {[PluginAPI]} plugins         The unsorted plugins array
     * @returns {[PluginAPI]}                 An array of plugins sorted depending on dependencies
     */
    topsortedArrayConverter(toposortedArray, plugins) {
        let sortedArray = [];
        toposortedArray.forEach((element) => {
            plugins.forEach((plugin) => {
                if (element === plugin.identifier) {
                    sortedArray.push(plugin);
                }
            });

        });

        return sortedArray;
    }

    /**
     * Returns a plugin configuration
     *
     * @param  {string} identifier The plugin identifier
     * @returns {PluginConf}            The plugin configuration
     */
    getPluginConf(identifier) {
        let item = null;
        this.pluginsConf.forEach((pluginConf) => {
            if (identifier === pluginConf.identifier) {
                item = pluginConf;
            }
        });

        return item;
    }

    /**
     * Change plugin status
     *
     * @param  {PluginConf} pluginConf The changing plugin conf
     * @param  {boolean} status     The new status
     * @param  {boolean} restart     Set `true` if you want restart system,  `false` otherwise
     */
    changePluginStatus(pluginConf, status, restart = true) {
        Logger.info("Plugin status changed : " + pluginConf.identifier);
        if ((CORE_PLUGINS.indexOf(pluginConf.identifier) === -1)) {
            if (!status) {
                // Stop all dependent plugins
                this.plugins.forEach((plugin) => {
                    if (plugin.dependencies.indexOf(pluginConf.identifier) !== -1) {
                        const dependentPluginConf = this.getPluginConf(plugin.identifier);

                        Logger.info("Plugin dependency changed " + dependentPluginConf.identifier);
                        dependentPluginConf.enable = status;
                        this.pluginsConf = this.confManager.setData(CONF_KEY, dependentPluginConf, this.pluginsConf, PluginConf.comparator);
                    }
                });
            } else {
                // Start dependent plugins
                if (pluginConf.dependencies && pluginConf.dependencies.length > 0) {
                    pluginConf.dependencies.forEach((dependencyIdentifier) => {
                        const dependentPluginConf = this.getPluginConf(dependencyIdentifier);
                        Logger.info("Plugin dependency changed " + dependentPluginConf.identifier);
                        dependentPluginConf.enable = status;
                        this.pluginsConf = this.confManager.setData(CONF_KEY, dependentPluginConf, this.pluginsConf, PluginConf.comparator);
                    });
                }
            }


            Logger.info("Plugin status changed " + pluginConf.identifier + " / " + status);
            pluginConf.enable = status;
            this.pluginsConf = this.confManager.setData(CONF_KEY, pluginConf, this.pluginsConf, PluginConf.comparator);
            if (restart) {
                this.eventBus.emit(HautomationRunnerConstants.RESTART);
            }
        } else {
            throw Error(ERROR_DISABLE_CORE_PLUGIN);
        }
    }


    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        if (apiRequest.route === ROUTE_WS_GET) {
            let plugins = [];

            this.plugins.forEach((plugin) => {
                const services = [];
                const pluginConf = this.getPluginConf(plugin.identifier);

                plugin.servicesManagerAPI.services.forEach((service) => {
                    services.push({name:service.name, status:service.status});
                });

                plugins.push({
                    identifier:plugin.identifier,
                    description:plugin.description,
                    configurable:plugin.configurationAPI.form?true:false,
                    category:plugin.category,
                    version:plugin.version,
                    services:services,
                    dependencies:plugin.dependencies,
                    enabled:(pluginConf && pluginConf.enable)?true:false,
                    corePlugin:(CORE_PLUGINS.indexOf(plugin.identifier) !== -1)
                });
                plugins = plugins.sort(function (a,b) {
                    return a.identifier.localeCompare(b.identifier);
                });
            });
            return new Promise((resolve) => {
                resolve(new APIResponse.class(true, plugins));
            });
        }  else if (apiRequest.route.startsWith(ROUTE_WS_ENABLE_SET_BASE)) {
            return new Promise((resolve, reject) => {

                const existingPluginConf = this.getPluginConf(apiRequest.data.plugin);
                if (existingPluginConf) {
                    const status = !!+apiRequest.data.status;
                    let error = null;
                    if (status != existingPluginConf.enable) {
                        try {
                            this.changePluginStatus(existingPluginConf, status);
                        } catch(e) {
                            error = e;
                        }

                    }

                    if (error) {
                        resolve(new APIResponse.class(false, {}, 2295, error.message));
                    } else {
                        resolve(new APIResponse.class(true, {success:true}));
                    }
                } else {
                    reject(new APIResponse.class(false, null, 9872, "Unexisting plugin"));
                }
            });
        } else if (apiRequest.route == ROUTE_WS_GENERAL_ENABLE_SET) {
            return new Promise((resolve, reject) => {
                let rejected = false;
                if (apiRequest.data && apiRequest.data.status && apiRequest.data.status.length > 0) {
                    apiRequest.data.status.forEach((pluginStatus) => {
                        const existingPluginConf = this.getPluginConf(pluginStatus.identifier);
                        if (existingPluginConf) {
                            const status = !!+pluginStatus.status;
                            let error = null;
                            if (status != existingPluginConf.enable && CORE_PLUGINS.indexOf(pluginStatus.identifier) === -1) {
                                try {
                                    this.changePluginStatus(existingPluginConf, status, false);
                                } catch(e) {
                                    error = e;
                                }

                            }

                            if (error) {
                                resolve(new APIResponse.class(false, {}, 11295, error.message));
                                rejected = true;
                            }
                        } else {
                            reject(new APIResponse.class(false, null, 11872, "Unexisting plugin"));
                            rejected = true;
                        }
                    });
                    if (!rejected) {
                        this.eventBus.emit(HautomationRunnerConstants.RESTART);
                        resolve(new APIResponse.class(true, {success:true}));
                    }
                } else {
                    reject(new APIResponse.class(false, null, 9878, "Missing JSON data with status property : {status:[identifier:foo, status:true]}"));
                }
            });
        }
    }
}

module.exports = {class:PluginsManager, ERROR_MISSING_PROPERTY:ERROR_MISSING_PROPERTY, ERROR_NOT_A_FUNCTION:ERROR_NOT_A_FUNCTION, ERROR_DEPENDENCY_NOT_FOUND:ERROR_DEPENDENCY_NOT_FOUND, EVENT_LOADED:EVENT_LOADED, ERROR_DISABLE_CORE_PLUGIN:ERROR_DISABLE_CORE_PLUGIN, CORE_PLUGINS:CORE_PLUGINS};
