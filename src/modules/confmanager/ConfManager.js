"use strict";
var Logger = require("./../../logger/Logger");
var fs = require("fs");

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
     * @returns {ConfManager} The instance
     */
    constructor(appConfiguration) {
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
                Logger.err("Invalid json file for path " + jsonPath);
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
        this.fs.writeFile(this.getFilePath(key), JSON.stringify(data), (err) => {
            if (err) {
                throw err;
            }
        });
    }

    /**
     * Load data from file
     *
     * @param  {class} classType The object class. This class MUST implement a json() method to process JSON to Object mapping
     * @param  {string} key A file store key
     * @returns {Object}      An object instance of classType
     */
    loadData(classType, key) {
        const content = this.readFile(this.getFilePath(key));

        if (content != null) {
            let o = new classType();
            if (typeof o.json === "function") {
                return o.json(content);
            } else {
                throw Error(ERROR_NO_JSON_METHOD);
            }
        } else {
            return null;
        }
    }

    /**
     * Load multiple datas from file (Array)
     *
     * @param  {class} classType The object class. This class MUST implement a json() method to process JSON to Object mapping
     * @param  {string} key A file store key
     * @returns {Array}      An array of objects (instance of classType)
     */
    loadDatas(classType, key) {
        const content = this.readFile(this.getFilePath(key));

        if (content != null && content instanceof Array) {
            let results = [];
            content.forEach((element) => {
                let o = new classType();
                if (typeof o.json === "function") {
                    results.push(o.json(element));
                } else {
                    throw Error(ERROR_NO_JSON_METHOD);
                }
            });
            return results;
        }

        return null;
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
     * Set data into object's array (save)
     *
     * @param  {Array} datas      An array of objects
     * @param  {string} key A file store key
     * @param  {Object} object     The object to search
     * @param  {Function} comparator A comparator function with 2 parameters (obj1, obj2). The comparator must return true if objects are equals. Else false.
     * @returns {[Object]}     The Array of Objects updated
     */
    setData(datas, key, object, comparator) {
        try {
            this.removeData(datas, key, object, comparator);
        } catch (e) {
            Logger.verbose(e);
        }
        datas.push(object);
        this.saveData(datas, key);
        return datas;
    }

    /**
     * Remove data into object's array (delete). Can throw error.
     *
     * @param  {Array} datas      An array of objects
     * @param  {string} key A file store key
     * @param  {Object} object     The object to search
     * @param  {Function} comparator A comparator function with 2 parameters (obj1, obj2). The comparator must return true if objects are equals. Else false.
     * @returns {[Object]}     The Array of Objects updated
     */
    removeData(datas, key, object, comparator) {
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
    }
}

module.exports = {class:ConfManager,
    ERROR_EMPTY_FILE:ERROR_EMPTY_FILE, ERROR_INVALID_JSON:ERROR_INVALID_JSON, ERROR_INVALID_FILE:ERROR_INVALID_FILE,ERROR_NO_JSON_METHOD:ERROR_NO_JSON_METHOD,
    DATA_NOT_FOUND:DATA_NOT_FOUND};
