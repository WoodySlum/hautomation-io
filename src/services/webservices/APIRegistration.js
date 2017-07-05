"use strict";
var Authentication = require("./../../modules/authentication/Authentication");

const ERROR_INVALID_OPTIONAL_PARAMETER = "Optional fiels should be placed at the end of the URL";

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

        this.parameters = [];

        this.routeBase = [];
        this.nbParametersOptional = 0;

        this.route.split("/").forEach((routeElement) => {
            if (routeElement != ":" && routeElement != "") {
                this.routeBase.push(routeElement);
            }
            const regex = /(\[)([a-zA-Z0-9\-\*]+)(\])/g;
            let r = regex.exec(routeElement);
            if (r && r.length > 2) {
                const optional = (r[2].indexOf("*") === -1)?false:true;
                if (optional) {
                    this.nbParametersOptional++;
                }
                if (!optional && this.nbParametersOptional > 0) {
                    throw Error(ERROR_INVALID_OPTIONAL_PARAMETER);
                }

                this.route = this.route.replace("/" + routeElement, "");
                this.parameters.push({name:r[2].replace("*", ""),optional:optional});
            }
        });
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

module.exports = {class:APIRegistration, ERROR_INVALID_OPTIONAL_PARAMETER:ERROR_INVALID_OPTIONAL_PARAMETER};
