"use strict";
var Logger = require("./../../logger/Logger");
var User = require("./User");
var Authentication = require("./../authentication/Authentication");

const CONF_KEY = "users";
const ERROR_USER_NOT_FOUND = "ERROR_USER_NOT_FOUND";

class UserManager {
    constructor(confManager) {
        /**
         * Configuration manager
         * @type {ConfManager}
         */
        this.confManager = confManager;

        try {
            /**
             * Users
             * @type {[User]}
             */
            this.users = this.confManager.loadDatas(User.class, CONF_KEY);
        } catch(e) {
            Logger.warn("Load users error : " + e.message);
            this.users = [];
        }
    }

    /**
     * Delete specific user
     *
     * @param  {string} username The username
     */
    removeUser(username) {
        let user = this.getUser(username);
        try {
            this.users = this.confManager.removeData(this.users, CONF_KEY, user, this.compareUser);
        } catch(e) {
            throw Error(ERROR_USER_NOT_FOUND);
        }
    }

    /**
     * Return a COPY of the user array
     *
     * @returns {[User]} An array of Users
     */
    getUsers() {
        return this.users.slice();
    }

    /**
     * Comparator for users
     *
     * @param  {User} user1 A user
     * @param  {User} user2 Another user
     * @returns {boolean}       True if user are identical, else false
     */
    compareUser(user1, user2) {
        return (user1.username == user2.username)?true:false;
    }

    /**
     * Get a user with username
     *
     * @param  {string} username The username
     * @returns {User}   A user, null if user does not exists
     */
    getUser(username) {
        return this.confManager.getData(this.users, new User.class(username), this.compareUser);
    }

    /**
     * Set user and store into json
     *
     * @param {User} user A user
     */
    setUser(user) {
        try {
            this.users = this.confManager.setData(this.users, CONF_KEY, user, this.compareUser);
        } catch (e) {
            Logger.err("Could not save user : " + e.message);
        }
    }

    /**
     * Get the admin user
     *
     * @returns {User} The admin user, null if admin user is disabled
     */
    getAdminUser() {
        if (this.confManager.appConfiguration.admin.enable) {
            return new User.class(this.confManager.appConfiguration.admin.username, this.confManager.appConfiguration.admin.password, Authentication.AUTH_MAX_LEVEL);
        }

        return null;
    }
}

module.exports = {class:UserManager, ERROR_USER_NOT_FOUND:ERROR_USER_NOT_FOUND};
