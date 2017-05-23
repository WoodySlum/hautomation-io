/* eslint-disable */
"use strict";

/**
 * This class is a sample plugin
 * @class
 */
class Sample {
    constructor(api, options) {
        this.api = api;
        this.api.webAPI.register(this, "*", ":/test/", this.api.webAPI.Authentication().AUTH_NO_LEVEL);
    }

    /**
     * Process API callback
     *
     * @param  {[type]} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        return new Promise((resolve, reject) => {
        // API has been successfully processed by the class, and return a foo bar object
        resolve(this.api.webAPI.APIResponse(true, {"foo":"bar"}));
     } );

    }
}

module.exports = (api, options) => {
    let s = new Sample(api.root, options);
};

module.exports.attributes = {
    name: "sample-plugin",
    version: "0.0.0",
    category: "misc",
    description: "I'm a sample plugin"
};
