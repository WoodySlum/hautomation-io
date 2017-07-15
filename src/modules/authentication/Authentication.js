/*eslint "require-jsdoc": 0*/
"use strict";

var AuthenticationData = require("./AuthenticationData");
var APIResponse = require("./../../services/webservices/APIResponse");
var WebServices = require("./../../services/webservices/WebServices");

const USERNAME = "u";
const PASSWORD = "p";
//const TOKEN    = "t";
const AUTH_NO_LEVEL = 0;
const AUTH_USAGE_LEVEL = 10;
const AUTH_ADMIN_LEVEL = 80;
const AUTH_MAX_LEVEL = 100;

const LOGIN_ROUTE = ":/login/";

/**
 * This class manage authentication for Web Services
 * @class
 */
class Authentication {

    /**
     * Constructor
     *
     * @param  {WebService} webService  The web service instance
     * @param  {UserManager} userManager User manager
     *
     * @returns {Authentication} Instance
     */
    constructor(webService, userManager) {
        webService.registerAPI(this, "*", "*", AUTH_NO_LEVEL);
        webService.registerAPI(this, WebServices.GET, LOGIN_ROUTE, AUTH_USAGE_LEVEL);
        this.userManager = userManager;
    }

    processAPI(apiRequest) {
        let t = this;
        let promises = [];
        promises.push(new Promise( function(resolve, reject) {
            t.processAuthentication(apiRequest, resolve, reject);
        }));

        if (apiRequest.route === LOGIN_ROUTE) {
            promises.push(new Promise( function(resolve) {
                resolve(new APIResponse.class(true, apiRequest.authenticationData));
            }));
        }

        return promises;
    }

    processAuthentication(apiRequest, resolve, reject) {
        let u = apiRequest.params[USERNAME];
        let p = apiRequest.params[PASSWORD];
        //let t = apiRequest.params[TOKEN];
        let admin = this.userManager.getAdminUser();

        let users = this.userManager.getUsers();
        if (admin) {
            users.push(admin);
        }

        let userAuth = null;
        users.forEach((user) => {
            if (u === user.username && p === user.password) {
                userAuth = user;
                return;
            }
        });

        if (!u && !p) {
            apiRequest.addAuthenticationData(new AuthenticationData.class(false, null, AUTH_NO_LEVEL));
            resolve(new APIResponse.class(true));
        } else if (userAuth) {
            apiRequest.addAuthenticationData(new AuthenticationData.class(true, userAuth.username, userAuth.level));
            resolve(new APIResponse.class(true));
        } else {
            reject(new APIResponse.class(false, {}, 811, "Invalid username and/or password"));
        }


    }
}

module.exports = {class:Authentication, AUTH_NO_LEVEL:AUTH_NO_LEVEL, AUTH_USAGE_LEVEL:AUTH_USAGE_LEVEL, AUTH_ADMIN_LEVEL:AUTH_ADMIN_LEVEL, AUTH_MAX_LEVEL:AUTH_MAX_LEVEL};
