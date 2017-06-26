"use strict";
const PrivateProperties = require("./../PrivateProperties");
const path = require("path");
const callsite = require("callsite");

/**
 * Public API for translations
 * @class
 */
class TranslateAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {TranslateManager} translateManager The translate manager instance
    //  * @returns {TranslateAPI}             The instance
    //  */
    constructor(translateManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).translateManager = translateManager;
    }
    /* eslint-enable */

    /**
     * Load translations. Called automatically when calling `api.init()`
     */
    load() {
        PrivateProperties.oprivate(this).translateManager.addTranslations(path.dirname(callsite()[2].getFileName()));
    }

    /**
     * Return a translation value
     *
     * @param  {string} key    the key where values containe possible `%@` placeholders
     * @param  {...string} values Optional, the placeholders values. Each `%@` will be sequentially replaced by thos values
     * @returns {string}        A translation
     */
    t(key, ...values) {
        return PrivateProperties.oprivate(this).translateManager.t(key, ...values);
    }

}

module.exports = {class:TranslateAPI};
