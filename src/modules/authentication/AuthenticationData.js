"use strict";

/**
 * This class encapsulate authentication data
 * @class
 */
class AuthenticationData {
    /**
     * Constructor
     *
     * @param  {boolean} [authorized=false] True if authorized, else false
     * @param  {string}  [username=null]    Username
     * @param  {inr}  [level=-1] Authorization level
     * @returns {Authentication} The instance
     */
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
