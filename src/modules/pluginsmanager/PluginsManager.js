"use strict";
var fs = require("fs");
var path = require("path");
var remi = require("remi");

var Logger = require("./../../logger/Logger");
var PluginAPI = require("./PluginAPI");

const INTERNAL_PLUGIN_PATH = "./../../internal-plugins/";
const EXTERNAL_PLUGIN_PATH = "plugins/node_modules/";
const PLUGIN_PREFIX = "hautomation-plugin";
const PLUGIN_MAIN = "plugin.js";

const INTERNAL_PLUGINS = [
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
     * @param  {WebServices} webServices     The web services
     * @returns {PluginsManager} The instance
     */
    constructor(webServices) {
        this.fs = fs;
        this.path = path;
        this.remi = remi;

        this.webServices = webServices;

        this.plugins = [];

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
     */
    checkPluginSanity(p) {
        if (!p.attributes.name || !p.attributes.version || !p.attributes.description || !p.attributes.category) {
            throw Error("Missing property name, version or description for plugin");
        } else if(!p || typeof p !== "function") {
            throw Error("Missing plugin class");
        }
    }

    /**
     * This method register plugins
     *
     * @param  {string}  path             Plugins path
     * @param  {[string]}  plugins        An array of plugins name
     * @param  {boolean} [relative=false] True if path is relative, else false
     */
    registerPlugins(path, plugins, relative = false) {
        plugins.forEach((plugin) => {
            let pluginPath = relative ? path + plugins +"/" + PLUGIN_MAIN : this.path.resolve() + "/" + path + plugins +"/" + PLUGIN_MAIN;
            Logger.verbose("Loading plugin at path : " + pluginPath);
            let p = require(pluginPath);
            let pApi = new PluginAPI.class(
                this.webServices,
                p.attributes.name,
                p.attributes.category,
                p.attributes.version,
                p.attributes.description
            );

            let registrator = this.remi(pApi);

            try {
                this.checkPluginSanity(p);

                registrator
                  .register([{
                      register: p,
                      options: {}
                  }])
                  .then(() => {
                      this.plugins.push(pApi);
                      Logger.info("Plugin " + plugin + " was successfully registered");
                  })
                  .catch((err) => {
                      console.error("Failed to load plugin:", err);
                  });
            } catch(e) {
                Logger.err(e.message + " (" + plugin + ")");
            }
        });
    }

    /**
     * Load all plugins (internal and external)
     */
    load() {
        let externalPlugins = this.getPluginsFromDirectory(EXTERNAL_PLUGIN_PATH);
        this.registerPlugins(INTERNAL_PLUGIN_PATH, INTERNAL_PLUGINS, true);
        this.registerPlugins(EXTERNAL_PLUGIN_PATH, externalPlugins);
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

}

module.exports = {class:PluginsManager};
