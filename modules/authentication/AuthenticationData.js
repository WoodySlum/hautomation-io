"use strict";

class AuthenticationData {

    constructor(authorized = false, username = null, level = -1) {
        /**
         * Authorized
         * @type {bool} authorized True if authorized, else no
         */
        this.authorized = authorized;
        /**
         * Username
         * @type {string} username The username
         */
        this.username = username;

        /**
         * App access level
         * @type {int} level Authorization level
         */
        this.level = level;
    }

}

module.exports = {class:AuthenticationData};
