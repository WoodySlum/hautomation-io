"use strict";
var Authentication = require("./../../modules/authentication/Authentication");

class APIRegistration {

    constructor(delegate, method = "*", route = "*", authLevel = Authentication.AUTH_USAGE_LEVEL) {
        /**
         * delegate
         * @type {Object}
         */
        this.delegate = delegate;
        /**
         * method
         * @type {string}
         */
        this.method = method;
        /**
         * route
         * @type {string}
         */
        this.route = route;
        /**
         * Authentication level requested for API
         * @type {int} An Authentication constant
         */
        this.authLevel = authLevel;
    }

    /**
     * Check if the parameter equality
     *
     * @param  {APIRegistration}  obj   An APIRegistration object
     * @returns {boolean}     true or false
     */
    isEqual(obj) {
        if (obj.delegate.constructor.name === this.delegate.constructor.name && obj.method === this.method && obj.route === this.route && obj.authLevel === this.authLevel) {
            return true;
        }
        return false;
    }
}

module.exports = {class:APIRegistration};
