"use strict";
var Logger = require("./../../logger/Logger");
var fs = require('fs');

const ERROR_EMPTY_FILE    = "ERROR_EMPTY_FILE";
const ERROR_INVALID_JSON  = "ERROR_INVALID_JSON";
const ERROR_INVALID_FILE  = "ERROR_INVALID_FILE";

class ConfManager {
    constructor(appConfiguration) {
        this.appConfiguration = appConfiguration;
    }

    getFilePath(key) {

        if (this.appConfiguration.configurationPath.slice(-1) == "/") {
            return this.appConfiguration.configurationPath +  key + ".json";
        } else {
            return this.appConfiguration.configurationPath +  "/" + key + ".json";
        }
    }

    isJsonValid(data) {
        try {
            JSON.parse(data);
       } catch (e) {
           return false;
       }
       return true;
    }

    readFile(jsonPath) {
        let t = this;
        try {
            let content = fs.readFileSync(jsonPath, 'utf-8');
            let validJson = t.isJsonValid(content);

            if (content && validJson) {
                return JSON.parse(content);
            } else {
                Logger.err("Empty or invalid json for path " + jsonPath);
                if (!content) throw Error(ERROR_EMPTY_FILE);
                if (!validJson) throw Error(ERROR_INVALID_JSON);
            }
        } catch (e) {
            Logger.err("Invalid json file for path " + jsonPath);
            throw Error(ERROR_INVALID_FILE);
        }

        return null;
    }

    saveData(data, key) {
        fs.writeFile(this.getFilePath(key), JSON.stringify(data), (err) => {
            if (err) {
                throw err;
            }
        });
    }

    loadData(type, key) {
        const content = this.readFile(this.getFilePath(key));
        if (content != null) {
            let o = new type.class();
            return o.json(content);
        } else {
            return null;
        }
    }

    loadDatas(type, key) {
        const content = this.readFile(this.getFilePath(key));

        if (content != null && content instanceof Array) {
            let results = [];
            content.forEach((element) => {
                let o = new type.class();
                results.push(o.json(element));
            });
            return results;
        }

        return null;
    }
    
}

module.exports = {class:ConfManager, ERROR_EMPTY_FILE:ERROR_EMPTY_FILE, ERROR_INVALID_JSON:ERROR_INVALID_JSON, ERROR_INVALID_FILE:ERROR_INVALID_FILE};
