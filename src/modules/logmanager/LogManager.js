"use strict";
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");
const Logger = require("./../../logger/Logger");

const ROUTE_LOG_GET_BASE = "/logs/get/";
const ROUTE_LOG_GET = ROUTE_LOG_GET_BASE + "[lastLogDate]/";

/**
 * This class allows to manage logs
 * @class
 */
class LogManager {
    /**
     * Constructor
     *
     * @param  {WebServices} webServices  The web services
     *
     * @returns {LogManager}              The instance
     */
    constructor(webServices) {
        webServices.registerAPI(this, WebServices.GET, ":" + ROUTE_LOG_GET, Authentication.AUTH_DEV_LEVEL);
    }


    /**
     * Get the logs list
     *
     * @param  {number} [ts=0] A timestamp in ms for the last retrieval
     * @returns {Array}        An array of logs
     */
    getLogs(ts = 0) {
        const history = Logger.getHistory();
        const logsRequest = [];
        history.forEach((el) => {
            if (parseInt(el.date) >= parseInt(ts)) {
                logsRequest.push(el);
            }
        });
        return logsRequest;
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        const self = this;
        if (apiRequest.route.startsWith( ":" + ROUTE_LOG_GET_BASE)) {
            return new Promise((resolve) => {
                const lastLogDate = (apiRequest.data && apiRequest.data.lastLogDate) ? parseInt(apiRequest.data.lastLogDate) : 0;
                resolve(new APIResponse.class(true, self.getLogs(lastLogDate)));
            });
        }
    }
}

module.exports = {class:LogManager};
