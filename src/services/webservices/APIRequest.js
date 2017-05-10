"use strict";

/**
 * This class is a POJO representing an APIRequest item
 * @class
 */
class APIRequest {

    /**
     * Constructor
     *
     * @param  {string} method      The method
     * @param  {string} ip          IP address
     * @param  {string} route       The route
     * @param  {Array} path         The path (route splitted in array)
     * @param  {string} action      The action (first element of route)
     * @param  {Object} params      The parameters under key / value format
     * @param  {Object} [data=null] The object sent
     * @returns {APIRequest}         The instance
     */
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
        if (this.route.slice(-1) != "/") {
            this.route += "/";
        }
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
     *
     * @param {AuthenticationData} authenticationData The data authentication
     */
    addAuthenticationData(authenticationData) {
        this.authenticationData = authenticationData;
    }

}

module.exports = {class:APIRequest};
