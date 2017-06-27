"use strict";
var fs = require("fs");
var path = require("path");
var remi = require("remi");
var remiRunner = require("remi-runner");
var toposort = require("toposort");

var Logger = require("./../../logger/Logger");
var PluginAPI = require("./PluginAPI");
var PluginConf = require("./PluginConf");

const CONF_KEY = "plugins";

const INTERNAL_PLUGIN_PATH = "./../../internal-plugins/";
const EXTERNAL_PLUGIN_PATH = "plugins/node_modules/";
const PLUGIN_PREFIX = "hautomation-plugin";
const PLUGIN_MAIN = "plugin.js";

const ERROR_MISSING_PROPERTY = "Missing property name, version or description for plugin";
const ERROR_NOT_A_FUNCTION = "Missing plugin class";
const ERROR_DEPENDENCY_NOT_FOUND = "Dependency not found";

const INTERNAL_PLUGINS = [
    "rflink",
    "radio",
    "sample"
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
     * @returns {PluginsManager} The instance
     */
    constructor(confManager, webServices, servicesManager, dbManager, translateManager, formManager) {
        this.fs = fs;
        this.path = path;
        this.remi = remi;

        this.webServices = webServices;
        this.servicesManager = servicesManager;
        this.confManager = confManager;
        this.dbManager = dbManager;
        this.translateManager = translateManager;
        this.formManager = formManager;

        this.plugins = [];
        try {
            this.pluginsConf = this.confManager.loadData(PluginConf.class, CONF_KEY);
        } catch(e) {
            this.pluginsConf = [];
        }

        this.load();
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
            let pluginPath = relative ? path + plugin +"/" + PLUGIN_MAIN : this.path.resolve() + "/" + path + plugin +"/" + PLUGIN_MAIN;
            Logger.verbose("Loading plugin at path : " + pluginPath);
            let p = require(pluginPath, "may-exclude");

            // Send old version for migration
            const pluginConf = this.confManager.getData(this.pluginsConf, new PluginConf.class(p.attributes.name), PluginConf.comparator);
            let oldVersion = "0.0.0";
            if (pluginConf && pluginConf.version) {
                oldVersion = pluginConf.version;
            }

            let pApi = new PluginAPI.class(
                oldVersion,
                p,
                this.webServices,
                this.servicesManager,
                this.dbManager,
                this.translateManager,
                this.formManager,
                this.confManager
            );

            initializedPlugins.push(pApi);
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
            // Save configuration meta data
            const pluginConf = new PluginConf.class(plugin.identifier, plugin.version);
            this.confManager.setData(CONF_KEY, pluginConf, this.pluginsConf, PluginConf.comparator);
            // Load
            plugin.loaded();
            // Reload exported
            classes = plugin.exported;

        });
    }

    /**
     * Get plugin per gategory
     *
     * @param  {string} category A category
     * @returns {Array}          An array of plugins
     */
    getPluginsByCategory(category) {
        let plugins = [];
        this.plugins.forEach((plugin) => {
            if (plugin.category.toLowerCase() === category.toLowerCase()) {
                plugins.push(plugin);
            }
        });

        return plugins;
    }

    /**
     * Get a plugin with identifier
     *
     * @param  {string} identifier A plugin identifier
     * @returns {PluginAPI}            A plugin
     */
    getPluginByIdentifier(identifier) {
        let p = null;
        this.plugins.forEach((plugin) => {
            if (plugin.identifier.toLowerCase() === identifier.toLowerCase()) {
                p = plugin;
                return;
            }
        });

        return p;
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

}

module.exports = {class:PluginsManager, ERROR_MISSING_PROPERTY:ERROR_MISSING_PROPERTY, ERROR_NOT_A_FUNCTION:ERROR_NOT_A_FUNCTION, ERROR_DEPENDENCY_NOT_FOUND:ERROR_DEPENDENCY_NOT_FOUND};
