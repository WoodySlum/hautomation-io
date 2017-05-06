"use strict";
// Internal
var Logger = require("./../../logger/Logger");
var Service = require("./../Service");

var APIRequest = require("./APIRequest");
var APIResponse = require("./APIResponse");

// External
var BodyParser = require('body-parser');

const CONTENT_TYPE = "content-type";

const HEADER_APPLICATION_JSON = "application/json";
const HEADER_APPLICATION_FORM = "application/x-www-form-urlencoded";

const API_ERROR_HTTP_CODE = 500;

class WebServices extends Service.class {

    constructor(port = 8080) {
        super();
        this.port = port;
        let express = require("express");
        this.app = express();
        this.server = null;
    }

    /**
     * Start Web Services
     */
    start() {
        if (this.status != Service.RUNNING) {
            let endpoint = "/api/";
            let instance = this;

            this.app.use(BodyParser.json());
            this.app.use(BodyParser.urlencoded({ extended: false }));

            // GET Apis
            this.app.get(endpoint + "*/", function(req, res) {
                let apiRequest = instance.manageResponse(req, endpoint);
                Logger.verbose(apiRequest);
                instance.runPromises(apiRequest, instance.buildPromises(apiRequest), res);
            });

            // POST Apis
            this.app.post(endpoint + "*/", function(req, res) {
                let apiRequest = instance.manageResponse(req, endpoint);
                Logger.verbose(apiRequest);
                instance.runPromises(apiRequest, instance.buildPromises(apiRequest), res);
            });

            this.server = this.app.listen(this.port);
            Logger.info("Web services are listening on port " + this.port);

            super.start();
        } else {
            Logger.warn("Web services are already running");
        }
    }

    /**
     * Stop Web Services
     */
    stop() {
        if (this.server && this.status == Service.RUNNING) {
            this.server.close();
        } else {
            Logger.warn("WebServices are not running, nothing to do...");
        }
    }

    /**
     * Create an API
     * @param  {Request} req        The WS request
     * @param  {string} endpoint    The WS endpoint
     * @return {APIRequest}         An API Request
     */
    manageResponse(req, endpoint) {
        let method = req.method;
        let ip = req.ip;
        let route = req.path.replace(endpoint, "");
        let path = route.split('/');
        let action = null;
        let params = {};

        if (path && path.length > 0) {
            // Last element is /
            if (path[path.length-1] === '') {
                path.splice(-1, 1);
            }

            // First element is action
            if (path.length > 0) {
                action = path[0];
                path.splice(0,1);
            }
        }

        if (method === "GET") {
            params = Object.assign(params, req.query);
        }

        if (method === "POST" && req.headers[CONTENT_TYPE] === HEADER_APPLICATION_FORM) {
            params = Object.assign(params, req.body);
        }

        let data = {};
        if (req.headers[CONTENT_TYPE] === HEADER_APPLICATION_JSON && req.body && req.body.length > 0) {
            data = req.body;
        }

        Logger.info(method + " " + req.path + " from " + ip + " " + req.headers[CONTENT_TYPE]);

        return new APIRequest.class(method, ip, route, path, action, params, data);
    }

    /**
     * Build a promise array from delegates
     * @param  {APIRequest} apiRequest The apiRequest
     * @return {[Promise]} An array of promises
     */
    buildPromises(apiRequest) {
        let promises = [];
        this.delegates.forEach((delegate) => {
            if (delegate != null && typeof delegate.processAPI === "function") {
                promises.push(delegate.processAPI(apiRequest));
            }
        });

        return promises;
    }

    /**
     * Run promises sequentially
     * @param  {[APIRequest]} apiRequest The API Request object
     * @param  {[promises]} promises     An array of promises (delegates callees)
     * @param  {Response} res            The response
     */
    runPromises(apiRequest, promises, res) {
        Promise.all(promises)
        .then((apiResponse) => {
            if (apiResponse) {
                this.sendAPIResponse(apiResponse, res);
            }
        }).catch((apiResponse) => {
            if (apiResponse) {
                this.sendAPIResponse([apiResponse], res);
            } else {
                this.sendAPIResponse([new APIResponse.class()], res);
            }
        });
    }

    /**
     * Process sending results in JSON to API caller
     * @param  {[APIResponse]} apiResponses The API responses
     * @param  {Response} res             The response
     */
    sendAPIResponse(apiResponses, res) {
        Logger.verbose(apiResponses);

        let apiResponse = new APIResponse.class();
        apiResponses.forEach((r) => {
            if (r) {
                apiResponse = r;
                // If an error has occured during promises process, keep this result, else keep most recent result
                if (r.success == false) {
                    return;
                }
            }

        });

        Logger.info(apiResponse);
        if (apiResponse.success) {
            res.json(apiResponse.response);
        } else {
            res.status(API_ERROR_HTTP_CODE).json({"code":apiResponse.errorCode,"message":apiResponse.errorMessage});
        }
    }
}

module.exports = {class:WebServices, CONTENT_TYPE:CONTENT_TYPE, HEADER_APPLICATION_JSON:HEADER_APPLICATION_JSON, HEADER_APPLICATION_FORM:HEADER_APPLICATION_FORM, API_ERROR_HTTP_CODE:API_ERROR_HTTP_CODE};
