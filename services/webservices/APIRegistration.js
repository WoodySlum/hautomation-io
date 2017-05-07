"use strict";

class APIRegistration {

    constructor(delegate, method = "*", route = "*") {
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
    }

    /**
     * Check if the parameter equality
     * @param  {APIRegistration}  obj   An APIRegistration object
     * @return {Boolean}     true or false
     */
    isEqual(obj) {
        if (obj.delegate.constructor.name === this.delegate.constructor.name && obj.method === this.method && obj.route === this.route) {
            return true;
        }
        return false;
    }
}

module.exports = {class:APIRegistration};
