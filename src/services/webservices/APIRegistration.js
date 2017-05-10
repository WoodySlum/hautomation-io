"use strict";
var Authentication = require("./../../modules/authentication/Authentication");

/**
 * This class is a POJO representing an APIRegistration item
 * @class
 */
class APIRegistration {
    /**
     * Constructor
     *
     * @param  {Object} delegate  The object which implements the processAPI callback
     * @param  {string} [method="*"] The method (GET, POST, ...)
     * @param  {string} [route="*"] The needed route (:/foo/bar)
     * @param  {int} [authLevel=Authentication.AUTH_USAGE_LEVEL] The authentication level needed to be called
     * @returns {APIRegistration} The instance
     */
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
