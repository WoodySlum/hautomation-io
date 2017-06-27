"use strict";
// Internal
var Logger = require("./../../logger/Logger");
var Service = require("./../Service");

var APIRequest = require("./APIRequest");
var APIResponse = require("./APIResponse");
var APIRegistration = require("./APIRegistration");
var Authentication = require("./../../modules/authentication/Authentication");

// External
var BodyParser = require("body-parser");
var fs = require("fs");
var https = require("https");

// Constants
const CONTENT_TYPE = "content-type";

const HEADER_APPLICATION_JSON = "application/json";
const HEADER_APPLICATION_FORM = "application/x-www-form-urlencoded";
const DATA_FIELD = "data";
const GET = "GET";
const POST = "POST";

const API_ERROR_HTTP_CODE = 500;

const INFOS_ENDPOINT = ":/infos/";

/**
 * This class manage Web Services call, and more specifically the external APIs
 * @class
 */
class WebServices extends Service.class {

    /**
     * Constructor
     *
     * @param  {int} [port=8080]        The listening HTTP port
     * @param  {int} [sslPort=8443]     The listening HTTPS port
     * @param  {string} [sslKey=null]   The path for SSL key
     * @param  {string} [sslCert=null]  The path for sslCert key
     * @returns {WebServices}            The instance
     */
    constructor(port = 8080, sslPort = 8043, sslKey = null, sslCert = null) {
        super("webservices");
        this.port = port;
        this.sslPort = sslPort;
        let express = require("express");
        this.app = express();
        this.servers = [];
        this.sslKey = sslKey;
        this.sslCert = sslCert;
        this.fs = fs;
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

            try {
                let sslServer = https.createServer({
                    key: this.fs.readFileSync(this.sslKey),
                    cert: this.fs.readFileSync(this.sslCert)
                }, this.app).listen(this.sslPort);
                this.servers.push(sslServer);
                Logger.info("Web services are listening on port " + this.sslPort);
            } catch (e) {
                Logger.err("SSL Server can't start");
                Logger.err(e.message);
            }

            try {
                let server = this.app.listen(this.port);
                this.servers.push(server);
                Logger.info("Web services are listening on port " + this.port);
            } catch (e) {
                Logger.err("HTTP Server can not started");
            }

            super.start();

            // Register informations for helping
            this.registerInfos();

        } else {
            Logger.warn("Web services are already running");
        }
    }

    /**
     * Register and list informations
     */
    registerInfos() {
        this.registerAPI(this, GET, INFOS_ENDPOINT, Authentication.AUTH_NO_LEVEL);
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        if (apiRequest.route === INFOS_ENDPOINT) {

            return new Promise((resolve) => {
                let registered = {};

                this.delegates.forEach((registeredEl) => {
                    if (!registered[registeredEl.delegate.constructor.name]) {
                        registered[registeredEl.delegate.constructor.name] = {
                            method: {
                                [registeredEl.method]:[
                                    registeredEl.route
                                ]
                            }
                        };
                    } else {
                        if (registered[registeredEl.delegate.constructor.name].method[registeredEl.method]) {
                            registered[registeredEl.delegate.constructor.name].method[registeredEl.method].push(registeredEl.route);
                        } else {
                            registered[registeredEl.delegate.constructor.name].method[registeredEl.method] = [registeredEl.route];
                        }
                    }

                });

                // API has been successfully processed by the class, and return a foo bar object
                resolve(new APIResponse.class(true, registered));
            });
        }
    }

    /**
     * Stop Web Services
     */
    stop() {
        if (this.server && this.status == Service.RUNNING) {
            this.servers.forEach((server) => {
                server.close();
            });
            this.servers = [];
        } else {
            Logger.warn("WebServices are not running, nothing to do...");
        }
    }

    /**
     * Override Register service callback
     *
     * @param  {Object} delegate The service delegate
     */
    register(delegate) {
        this.registerAPI(delegate);
    }

    /**
     * Override Unregister service callback
     *
     * @param  {Object} delegate The service delegate
     */
    unregister(delegate) {
        this.unregisterAPI(delegate);
    }

    /**
     * Register to a specific API to be notified when a route and/or method is called
     *
     * @param  {Object} delegate     A delegate which implements the processAPI(apiRequest) function
     * @param  {string} [method="*"] A method (*, WebServices.GET / WebServices.POST)
     * @param  {string} [route="*"]  A route (*, :/my/route/)
     * @param  {int} authLevel  An authentification level
     */
    registerAPI(delegate, method = "*", route = "*", authLevel = Authentication.AUTH_USAGE_LEVEL) {
        let found = false;
        let registration = new APIRegistration.class(delegate, method, route, authLevel);
        this.delegates.forEach((d) => {
            if (d.isEqual(registration)) {
                found = true;
                return;
            }
        });
        if (!found) {
            super.register(registration);
        } else {
            Logger.warn("Delegate already registered");
        }
    }

    /**
     * Unregister a specific API to be not notified when a route and/or method is called
     *
     * @param  {Object} delegate     A delegate which implements the processAPI(apiRequest) function
     * @param  {string} [method="*"] A method (*, WebServices.GET / WebServices.POST)
     * @param  {string} [route="*"]  A route (*, :/my/route/)
     */
    unregisterAPI(delegate, method = "*", route = "*") {
        let found = false;
        let registration = new APIRegistration.class(delegate, method, route);
        this.delegates.forEach((d) => {
            if (d.isEqual(registration)) {
                found = true;
                registration = d;
                return;
            }
        });
        if (found) {
            super.unregister(registration);
        } else {
            Logger.warn("Delegate not registered");
        }
    }

    /**
     * Create an API
     *
     * @param  {Request} req        The WS request
     * @param  {string} endpoint    The WS endpoint
     * @returns {APIRequest}         An API Request
     */
    manageResponse(req, endpoint) {
        let method = req.method;
        let ip = req.ip;
        let route = req.path.replace(endpoint, "");
        let path = route.split("/");
        let action = null;
        let params = {};

        if (path && path.length > 0) {
            // Last element is /
            if (path[path.length-1] === "") {
                path.splice(-1, 1);
            }

            // First element is action
            if (path.length > 0) {
                action = path[0];
                path.splice(0,1);
            }
        }

        let methodConstant = null;
        if (method === "GET") {
            params = Object.assign(params, req.query);
            methodConstant = GET;
        }

        if (method === "POST" && req.headers[CONTENT_TYPE] === HEADER_APPLICATION_FORM) {
            params = Object.assign(params, req.body);
            methodConstant = POST;
        }

        let data = {};

        if (method === "POST" && req.headers[CONTENT_TYPE] === HEADER_APPLICATION_JSON && req.body) {
            methodConstant = POST;

            // If application/json header
            if (req.body.data) {
                data = req.body[DATA_FIELD];
                params = Object.assign(params, req.body);
                delete params[DATA_FIELD];
            } else {
                Logger.warn("Empty body content");
            }
        }

        Logger.info(method + " " + req.path + " from " + ip + " " + req.headers[CONTENT_TYPE]);

        return new APIRequest.class(methodConstant, ip, route, path, action, params, data);
    }

    /**
     * Build a promise array from delegates
     *
     * @param  {APIRequest} apiRequest The apiRequest
     * @returns {[Promise]} An array of promises
     */
    buildPromises(apiRequest) {
        let promises = [];

        this.delegates.forEach((registeredEl) => {

            if ((registeredEl.method === "*"
                || registeredEl.method === apiRequest.method)
                && (registeredEl.route === "*"
                || apiRequest.route.startsWith(registeredEl.route) === true)
                && registeredEl.delegate != null
                && typeof registeredEl.delegate.processAPI === "function") {
                Logger.verbose("API registered for class " + registeredEl.delegate.constructor.name + " level : " + registeredEl.authLevel + " / API Auth level : " + (apiRequest.authenticationData?apiRequest.authenticationData.level:"not defined yet"));
                if (!apiRequest.authenticationData || apiRequest.authenticationData && registeredEl.authLevel <= apiRequest.authenticationData.level) {
                    let p = registeredEl.delegate.processAPI(apiRequest);
                    if (!p) {
                        Logger.err("Error in web service api response");
                        p = new Promise((resolve) => {
                            resolve(new APIResponse.class(true, {}));
                        });
                    }
                    promises.push(p);
                } else if (apiRequest.authenticationData) {
                    promises.push(new Promise((resolve) => {resolve(new APIResponse.class(false, {}, 812, "Unauthorized"));}));
                }
            }
        });

        return promises;
    }

    /**
     * Run promises sequentially
     *
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
     *
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

module.exports = {class:WebServices, CONTENT_TYPE:CONTENT_TYPE,
    HEADER_APPLICATION_JSON:HEADER_APPLICATION_JSON, HEADER_APPLICATION_FORM:HEADER_APPLICATION_FORM,
    API_ERROR_HTTP_CODE:API_ERROR_HTTP_CODE,
    GET:GET,
    POST:POST
};
