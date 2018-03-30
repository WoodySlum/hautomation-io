"use strict";
var Logger = require("./../../logger/Logger");
var fs = require("fs-extra");
var TimeEventService = require("./../../services/timeeventservice/TimeEventService");

const ERROR_EMPTY_FILE    = "ERROR_EMPTY_FILE";
const ERROR_INVALID_JSON  = "ERROR_INVALID_JSON";
const ERROR_INVALID_FILE  = "ERROR_INVALID_FILE";
const ERROR_NO_JSON_METHOD = "ERROR_NO_JSON_METHOD";
const DATA_NOT_FOUND      = "DATA_NOT_FOUND";

/**
 * This class manage object persistence with JSON format
 * @class
 */
class ConfManager {
    /**
     * Constructor
     *
     * @param  {AppConfiguration} appConfiguration The app configuration object
     * @param  {EventEmitter} eventBus    The global event bus
     * @param  {string} stopEventName    The stop event name
     * @param  {TimeEventService} timeEventService    The time event service
     * @returns {ConfManager} The instance
     */
    constructor(appConfiguration, eventBus, stopEventName, timeEventService) {
        /**
         * App configuration
         * @type {Object}
         */
        this.appConfiguration = appConfiguration;
        /**
         * File system
         * @type {fs}
         */
        this.fs = fs;
        this.toBeSaved = {};
        this.timeEventService = timeEventService;

        // Write file on stop core
        const self = this;

        if (eventBus) {
            eventBus.on(stopEventName, () => {
                self.writeDataToDisk(self, false);
            });
        }

        if (!process.env.TEST) {
            this.timeEventService.register((self) => {
                self.writeDataToDisk(self, true);
            }, this, TimeEventService.EVERY_HOURS);
        }
    }

    /**
     * Returns the file path for specific key, depending on app configuration base path
     *
     * @param  {string} key A file store key
     * @returns {string}     Config file path
     */
    getFilePath(key) {

        if (this.appConfiguration.configurationPath.slice(-1) == "/") {
            return this.appConfiguration.configurationPath +  key + ".json";
        } else {
            return this.appConfiguration.configurationPath +  "/" + key + ".json";
        }
    }

    /**
     * Check if JSON is valid
     *
     * @param  {string}  data JSON string
     * @returns {boolean}      True if the json is valid, else false
     */
    isJsonValid(data) {
        try {
            JSON.parse(data);
        } catch (e) {
            return false;
        }
        return true;
    }

    /**
     * Read a file from a path. Can throw error.
     *
     * @param  {string} jsonPath The path
     * @returns {Object}          The decoded object
     */
    readFile(jsonPath) {
        let t = this;
        try {
            let content = this.fs.readFileSync(jsonPath, "utf-8");
            let validJson = t.isJsonValid(content);

            if (content && validJson) {
                return JSON.parse(content);
            } else {
                Logger.err("Empty or invalid json for path " + jsonPath);
                if (!content) throw Error(ERROR_EMPTY_FILE);
                if (!validJson) throw Error(ERROR_INVALID_JSON);
            }
        } catch (e) {
            if (e.message !== ERROR_EMPTY_FILE && e.message !== ERROR_INVALID_JSON) {
                Logger.warn("Invalid json file for path " + jsonPath);
                throw Error(ERROR_INVALID_FILE);
            } else {
                throw e;
            }
        }

        return null;
    }

    /**
     * Save data for a specific key. Can throw error.
     *
     * @param  {Object} data A JS object
     * @param  {string} key A file store key
     */
    saveData(data, key) {
        this.toBeSaved[key] = JSON.stringify(data);
    }

    /**
     * Write data to disk
     *
     * @param  {ConfManager}  context      A conf manager instance, context, typically `this`
     * @param  {boolean} [async=true] True if save asynchronously, false otherwise
     */
    writeDataToDisk(context, async = true) {
        Logger.info("Saving configuration files");
        const keys = Object.keys(context.toBeSaved);
        keys.forEach((key) => {
            if (async) {
                context.fs.writeFile(context.getFilePath(key), context.toBeSaved[key], (err) => {
                    if (err) {
                        Logger.err(err);
                    } else {
                        delete context.toBeSaved[key];
                    }
                });
            } else {
                try {
                    context.fs.writeFileSync(context.getFilePath(key), context.toBeSaved[key]);
                } catch(e) {
                    Logger.err(e.message);
                }
            }
        });
    }

    /**
     * Load data from file (Array or object)
     *
     * @param  {class} classType The object class. This class MUST implement a json() method to process JSON to Object mapping
     * @param  {string} key A file store key
     * @param  {boolean} [disableClassMapping=false] Disable class mapping
     * @returns {Array}      An array of objects (instance of classType), or an object
     */
    loadData(classType, key, disableClassMapping = false) {
        const content = this.readFile(this.getFilePath(key));

        if (content != null && content instanceof Array) {
            let results = [];
            content.forEach((element) => {
                if (!disableClassMapping) {
                    let o = new classType();
                    if (typeof o.json === "function") {
                        results.push(o.json(element));
                    } else {
                        throw Error(ERROR_NO_JSON_METHOD);
                    }
                } else {
                    results.push(element);
                }
            });
            return results;
        } else {
            if (!disableClassMapping) {
                let o = new classType();
                if (typeof o.json === "function") {
                    return o.json(content);
                } else {
                    throw Error(ERROR_NO_JSON_METHOD);
                }
            } else {
                return content?content:{};
            }
        }
    }

    /**
     * Get data from object's array (search)
     *
     * @param  {Array} datas      An array of objects
     * @param  {Object} object     The object to search
     * @param  {Function} comparator A comparator function with 2 parameters (obj1, obj2). The comparator must return true if objects are equals. Else false.
     * @returns {Object}     Null if nothing found, Object instance if found
     */
    getData(datas, object, comparator) {
        let d = null;
        if (datas) {
            datas.forEach((item) => {
                if (comparator(object, item)) {
                    d = item;
                    return;
                }
            });
        }
        return d;
    }

    /**
     * Set data (save)
     *
     * @param  {string} key A file store key
     * @param  {Object} object     The object to search
     * @param  {Array} [datas=null]      An array of objects
     * @param  {Function} [comparator=null] A comparator function with 2 parameters (obj1, obj2). The comparator must return true if objects are equals. Else false.
     * @returns {[Object]}     The Array of Objects updated, or single object
     */
    setData(key, object, datas = null, comparator = null) {
        if (datas) {
            try {
                datas = this.removeData(key, object, datas, comparator);
            } catch (e) {
                Logger.verbose(e.message);
            }

            datas.push(object);
            this.saveData(datas, key);

            return datas;
        } else {
            this.saveData(object, key);
            return object;
        }
    }

    /**
     * Remove data into object's array (delete). Can throw error.
     *
     * @param  {string} key A file store key
     * @param  {Object} object     The object to search
     * @param  {Array} [datas=null]      An array of objects
     * @param  {Function} [comparator=null] A comparator function with 2 parameters (obj1, obj2). The comparator must return true if objects are equals. Else false.
     * @returns {[Object]}     The Array of Objects updated
     */
    removeData(key, object, datas = null, comparator = null) {
        if (datas) {
            let d = this.getData(datas, object, comparator);
            if (d) {
                let index = datas.indexOf(d);
                if (index > -1) {
                    datas.splice(index, 1);
                    this.saveData(datas, key);
                    return datas;
                }
            } else {
                throw Error(DATA_NOT_FOUND);
            }
        } else {
            this.saveData(null, key);
        }
    }
}

module.exports = {class:ConfManager,
    ERROR_EMPTY_FILE:ERROR_EMPTY_FILE, ERROR_INVALID_JSON:ERROR_INVALID_JSON, ERROR_INVALID_FILE:ERROR_INVALID_FILE,ERROR_NO_JSON_METHOD:ERROR_NO_JSON_METHOD,
    DATA_NOT_FOUND:DATA_NOT_FOUND};
