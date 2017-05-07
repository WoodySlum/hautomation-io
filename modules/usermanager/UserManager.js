"use strict";
var Logger = require("./../../logger/Logger");
var User = require("./User");
var Authentication = require("./../authentication/Authentication");

const CONF_KEY = "users";
const ERROR_USER_NOT_FOUND = "ERROR_USER_NOT_FOUND";

class UserManager {
    constructor(confManager) {
        this.confManager = confManager;

        try {
            this.users = this.confManager.loadDatas(User, CONF_KEY);
        } catch(e) {
            Logger.warn("Load users error : " + e.message);
            this.users = [];
        }
    }

    delUser(username) {
        let user = this.getUser(username);

        if (user) {
            let index = this.users.indexOf(user);
            if (index > -1) {
                Logger.verbose("User " + username + " found");
                this.users.splice(index, 1);
            } else {
                Logger.verbose("User " + username + " not found");
                throw Error(ERROR_USER_NOT_FOUND);
            }
        } else {
            Logger.verbose("User " + username + " not found");
            throw Error(ERROR_USER_NOT_FOUND);
        }

    }

    /**
     * Return a COPY of the user array
     * @return {[User]} An array of Users
     */
    getUsers() {
        return this.users.slice();
    }

    getUser(username) {
        let user = null;

        this.users.forEach((u) => {
            if (u.username === username) {
                user = u;
                return;
            }
        });
        return user;
    }

    setUser(user) {
        try {
            this.delUser(user.username);
        } catch (e) {

        }
        this.users.push(user);
        this.confManager.saveData(this.users, CONF_KEY);
    }

    getAdminUser() {
        if (this.confManager.appConfiguration.admin.enable) {
            return new User.class(this.confManager.appConfiguration.admin.username, this.confManager.appConfiguration.admin.password, Authentication.AUTH_MAX_LEVEL);
        }

        return null;
    }
}

module.exports = {class:UserManager, ERROR_USER_NOT_FOUND:ERROR_USER_NOT_FOUND};
