"use strict";
var Logger = require("./../../logger/Logger");
var Alarm = require("./Alarm");
var WebServices = require("./../../services/webservices/WebServices");
var Authentication = require("./../authentication/Authentication");
var APIResponse = require("../../services/webservices/APIResponse");

const CONF_KEY = "alarm";
const ROUTE_GET_METHOD = ":/alarm/get/";
const ROUTE_POST_METHOD = ":/alarm/set/";

/**
 * This class allows to manage alarm (nable, disable, ...)
 * @class
 */
class AlarmManager {
    /**
     * Constructor
     *
     * @param  {ConfManager} confManager A configuration manager needed for persistence
     * @param  {WebServices} webServices The web services to register APIs
     * @returns {Alarm} The instance
     */
    constructor(confManager, webServices) {
        this.confManager = confManager;
        this.webServices = webServices;
        try {
            this.alarm = this.confManager.loadData(Alarm.class, CONF_KEY);
        } catch(e) {
            Logger.warn("Load alarm error : " + e.message);
            this.alarm = new Alarm.class();
        }

        // Register APIs
        this.webServices.registerAPI(this, WebServices.GET, ROUTE_GET_METHOD, Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, ROUTE_POST_METHOD, Authentication.AUTH_USAGE_LEVEL);
    }

    /**
     * Set alarm from a generic JSON object
     *
     * @param {Object} object The JSON object
     */
    setAlarm(object) {
        Logger.info("Saving alarm");
        this.alarm = new Alarm.class().json(object);
        this.confManager.setData(CONF_KEY, this.alarm);
    }

    /**
     * Process web API callback
     *
     * @param  {APIRequest} apiRequest An API Request
     * @returns {Promise}            A promise with APIResponse
     */
    processAPI(apiRequest) {
        if (apiRequest.method === WebServices.GET && apiRequest.route === ROUTE_GET_METHOD) {
            return new Promise((resolve) => {
                resolve(new APIResponse.class(true, this.alarm));
            });
        }

        if (apiRequest.method === WebServices.POST && apiRequest.route === ROUTE_POST_METHOD) {
            return new Promise((resolve) => {
                this.setAlarm(apiRequest.data);
                resolve(new APIResponse.class(true, this.alarm));
            });
        }
    }
}

module.exports = {class:AlarmManager};
