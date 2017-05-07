"use strict";

class APIRequest {

    constructor(method, ip, route, path, action, params, data = null) {
        /**
         * method
         * @type {string}
         */
        this.method = method;
        /**
         * ip
         * @type {string}
         */
        this.ip = ip;
        /**
         * route
         * @type {string}
         */
        this.route = ":/" + route;
        /**
         * path
         * @type {string}
         */
        this.path = path;
        /**
         * action
         * @type {string}
         */
        this.action = action;
        /**
         * params
         * @type {object}
         */
        this.params = params;
        /**
         * data
         * @type {object}
         */
        this.data = data;

        /**
         * Authentication data
         * @type {AuthenticationData}
         */
        this.authenticationData = null;
    }

    /**
     * Add authentication data to request
     * @param {AuthenticationData} authenticationData The data authentication
     */
    addAuthenticationData(authenticationData) {
        this.authenticationData = authenticationData;
    }

}

module.exports = {class:APIRequest};
