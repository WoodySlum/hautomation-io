"use strict";
var Logger = require("./../../logger/Logger");

const DEFAULT_LANGUAGE = "en";

/**
 * This class manage translations
 * @class
 */
class TranslateManager {
    /**
     * Constructor
     *
     * @param  {string} lng The language
     * @returns {TranslatorManager}     The instance
     */
    constructor(lng) {
        this.lng = lng.toLowerCase();
        this.translations = {};
        // Logging
        // this.expected = {};
    }

    /**
     * Add translation data
     *
     * @param {string} folder The folder where translation is, should be usually `__dirname`, and get the following structure : lng/[code].json
     */
    addTranslations(folder) {
        try {
            const tData = require(folder + "/lng/" + DEFAULT_LANGUAGE + ".json");
            this.translations = Object.assign(this.translations, tData);

            if (DEFAULT_LANGUAGE != this.lng) {
                const tDataRequested = require(folder + "/lng/" + this.lng + ".json");
                this.translations = Object.assign(this.translations, tDataRequested);
            }
        } catch (e) {
            Logger.verbose("Could not load language file " + folder + "/lng/" + this.lng + ".json");
        }
    }

    /**
     * Return a translation value
     *
     * @param  {string} key    the key where values containe possible `%@` placeholders
     * @param  {...string} values Optional, the placeholders values. Each `%@` will be sequentially replaced by thos values
     * @returns {string}        A translation
     */
    t(key, ...values) {
        // Logging
        /*if (key && key.toString().indexOf(".") !== -1) {
            this.expected[key] = {
                key:key,
                values:values
            };
        }*/

        if (this.translations[key]) {
            let translation = this.translations[key];
            values.forEach((value) => {
                translation = translation.replace("%@", value);
            });
            return translation;
        } else {
            return key;
        }
    }

    /**
     * Translate an arraay of elements
     *
     * @param  {Array} arr An array of elements
     * @returns {Array}     An array of translated elements
     */
    translateArray(arr) {
        let translatedElements = [];
        if (arr && arr.length > 0) {
            arr.forEach((el) => {
                translatedElements.push(this.t(el));
            });
        }

        return translatedElements;
    }

    // Logging
    /*writeList() {
        const fs = require("fs");
        fs.writeFileSync("./data/translations.json", JSON.stringify(this.expected, null, "    "));
    }*/
}

module.exports = {class:TranslateManager};
