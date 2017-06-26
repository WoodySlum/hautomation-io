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
}

module.exports = {class:TranslateManager};
