"use strict";
const express = require("express");
const compression = require("compression");
const ngrok = require("ngrok");
const BreakException = require("./../../utils/BreakException").BreakException;
const sha256 = require("sha256");

// Internal
const Logger = require("./../../logger/Logger");
const Service = require("./../Service");

const APIRequest = require("./APIRequest");
const APIResponse = require("./APIResponse");
const APIRegistration = require("./APIRegistration");
const Authentication = require("./../../modules/authentication/Authentication");
const GatewayManager = require("./../../modules/gatewaymanager/GatewayManager");

// External
const BodyParser = require("body-parser");
const fs = require("fs-extra");
const http = require("https");
const https = require("https");
http.globalAgent.maxSockets = 20;
https.globalAgent.maxSockets = 20;

// Constants
const CONTENT_TYPE = "content-type";

const HEADER_APPLICATION_JSON = "application/json";
const HEADER_APPLICATION_FORM = "application/x-www-form-urlencoded";
const DATA_FIELD = "data";
const GET = "GET";
const POST = "POST";
const DELETE = "DELETE";
const ENDPOINT_API = "/api/";
const ENDPOINT_LNG = "/lng/";

const API_UP_TO_DATE = 304;
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
     * @param  {TranslateManager} translateManager       The translation manager
     * @param  {int} [port=8080]        The listening HTTP port
     * @param  {int} [sslPort=8443]     The listening HTTPS port
     * @param  {string} [sslKey=null]   The path for SSL key
     * @param  {string} [sslCert=null]  The path for sslCert key
     * @param  {string} [enableCompression=true]  Enable gzip data compression
     * @param  {string} [cachePath=null]  The cache path
     * @param  {string} [ngrokAuthToken=null]  The ngrok auth token
     * @returns {WebServices}            The instance
     */
    constructor(translateManager, port = 8080, sslPort = 8043, sslKey = null, sslCert = null, enableCompression = true, cachePath = null, ngrokAuthToken = null) {
        super("webservices");
        this.translateManager = translateManager;
        this.port = port;
        this.sslPort = sslPort;
        this.app = express();
        this.servers = [];
        this.sslKey = sslKey;
        this.sslCert = sslCert;
        this.fs = fs;
        this.cachePath = cachePath;
        this.ngrokAuthToken = ngrokAuthToken;
        this.enableCompression = enableCompression;
        this.gatewayManager = null;
        this.tokenAuthParameters = {};
        this.authentication = null;
    }

    /**
     * Start Web Services
     */
    start() {
        if (this.status != Service.RUNNING) {
            let endpoint = ENDPOINT_API;
            let instance = this;
            let cachePath = null;

            if (this.cachePath) {
                cachePath = this.cachePath + "/express/";
                fs.ensureDirSync(cachePath);
            }


            this.app.use(BodyParser.json({limit: "2mb"}));

            const allowCrossDomain = function(req, res, next) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
                res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, " + [Authentication.HEADER_USERNAME, Authentication.HEADER_PASSWORD, Authentication.HEADER_TOKEN, Authentication.HEADER_OLD_USERNAME, Authentication.HEADER_OLD_PASSWORD, Authentication.HEADER_OLD_TOKEN].join(", "));
                // intercept OPTIONS method
                if ("OPTIONS" == req.method) {
                    res.sendStatus(200);
                } else {
                    next();
                }
            };

            this.app.use(allowCrossDomain);

            // Compression
            if (this.enableCompression) {
                this.app.use(compression({filter: (req, res) => {
                    if (req.headers["x-no-compression"]) {
                        // don't compress responses with this request header
                        return false;
                    }

                    // fallback to standard filter function
                    return compression.filter(req, res);
                }}));
            }

            // Web UI
            this.app.use(BodyParser.urlencoded({ extended: false }));
            this.app.use(ENDPOINT_LNG, function(req, res){
                res.json(instance.translateManager.translations);
            });

            // GET Apis
            this.app.get(endpoint + "*/", function(req, res) {
                let apiRequest = instance.manageResponse(req, endpoint, res);
                const logObject = Object.assign({}, apiRequest);
                delete logObject.res;
                delete logObject.req;
                delete logObject.apiRegistration;
                Logger.verbose(logObject);
                instance.runPromises(apiRequest, instance.buildPromises(apiRequest), res);
            });

            // POST Apis
            this.app.post(endpoint + "*/", function(req, res) {
                let apiRequest = instance.manageResponse(req, endpoint, res);
                const logObject = Object.assign({}, apiRequest);
                delete logObject.res;
                delete logObject.req;
                delete logObject.apiRegistration;
                Logger.verbose(logObject);
                instance.runPromises(apiRequest, instance.buildPromises(apiRequest), res);
            });

            // DELETE Apis
            this.app.delete(endpoint + "*/", function(req, res) {
                let apiRequest = instance.manageResponse(req, endpoint, res);
                const logObject = Object.assign({}, apiRequest);
                delete logObject.res;
                delete logObject.req;
                delete logObject.apiRegistration;
                Logger.verbose(logObject);
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

            this.startTunnel();

            super.start();

            // Register informations for helping
            this.registerInfos();

        } else {
            Logger.warn("Web services are already running");
        }
    }

    /**
     * Start HTTP Tunnel
     */
    startTunnel() {
        // Start HTTP tunnel
        if (this.gatewayManager && !process.env.TEST) {
            setTimeout(async (self) => {
                // For pkg, copy binary outside container
                const platform = require("os").platform();
                const binExtension = "ngrok" + (platform === "win32" ? ".exe" : "");
                const ngrokBin = self.cachePath + binExtension;

                if (!fs.existsSync(ngrokBin)) {
                    Logger.info("Copy ngrok bin");
                    var binContent = fs.readFileSync(__dirname + "/../../../node_modules/ngrok/bin/" + binExtension);
                    fs.writeFileSync(ngrokBin, binContent);
                    fs.chmodSync(self.cachePath + binExtension, "0777");
                    binContent = null; // Clear variable
                }

                const ngrokOptions = {addr: self.port, protocol:"http", region: "eu", inspect:false, binPath: () => self.cachePath};
                if (this.ngrokAuthToken) {
                    ngrokOptions.authtoken = this.ngrokAuthToken;
                }

                ngrok.connect(ngrokOptions).then((url) => {
                    Logger.info("HTTP tunnel URL : " + url);

                    // Auto restart tunnel every 6 hours (expiration)
                    // New ngrok free account policy
                    setTimeout((t) => {
                        Logger.info("Restart HTTP tunnel due to expiration policy");
                        ngrok.disconnect();
                        ngrok.kill();
                        t.startTunnel();
                    }, 6 * 60 * 60 * 1000, this);

                    self.gatewayManager.bootMode = GatewayManager.BOOT_MODE_READY;
                    self.gatewayManager.tunnelUrl = url;
                    self.gatewayManager.transmit();

                    setTimeout((me, tunnelUrl) => { // Fix an issue where tunnel sent is null
                        me.gatewayManager.bootMode = GatewayManager.BOOT_MODE_READY;
                        me.gatewayManager.tunnelUrl = tunnelUrl;
                        me.gatewayManager.transmit();
                    }, 5 * 1000, self, url);

                }).catch((err) => {
                    Logger.err("Could not start HTTP tunnel : " + err.msg + " - " + err.error_code + " / " + err.status_code);
                    Logger.err(err.message);

                    setTimeout((me) => {
                        me.startTunnel();
                    }, 30 * 1000, self);
                    setTimeout((me) => { // Fix an issue where tunnel sent is null
                        me.gatewayManager.bootMode = GatewayManager.BOOT_MODE_BOOTING;
                        me.gatewayManager.tunnelUrl = null;
                        me.gatewayManager.transmit();
                    }, 5 * 1000, self);
                });
            }, 0, this);

        }
    }

    /**
     * Stop Web Services
     */
    stop() {
        if (this.servers && this.status == Service.RUNNING) {
            this.servers.forEach((server) => {
                server.close();
            });

            // Kill tunnel
            if (!process.env.TEST) {
                ngrok.disconnect();
                ngrok.kill();
            }

            this.servers = [];
            super.stop();
        } else {
            Logger.warn("WebServices are not running, nothing to do...");
        }
    }

    /**
     * Register and list informations
     */
    registerInfos() {
        this.registerAPI(this, GET, INFOS_ENDPOINT, Authentication.AUTH_DEV_LEVEL);
    }

    /**
     * Get the route serviceIdentifier
     *
     * @param  {string} route A route
     * @returns {string}       The identifier
     */
    getRouteIdentifier(route) {
        return sha256(route).substr(0, 8);
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
                                    {identifier:registeredEl.identifier, route:registeredEl.route, parameters:registeredEl.parameters, authLevel: registeredEl.authLevel}
                                ]
                            }
                        };
                    } else {
                        if (registered[registeredEl.delegate.constructor.name].method[registeredEl.method]) {
                            registered[registeredEl.delegate.constructor.name].method[registeredEl.method].push({identifier:registeredEl.identifier, route:registeredEl.route, parameters:registeredEl.parameters, authLevel: registeredEl.authLevel});
                        } else {
                            registered[registeredEl.delegate.constructor.name].method[registeredEl.method] = [{identifier:registeredEl.identifier, route:registeredEl.route, parameters:registeredEl.parameters, authLevel: registeredEl.authLevel}];
                        }
                    }

                });

                // API has been successfully processed by the class
                resolve(new APIResponse.class(true, registered));
            });
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
     * @param  {string} [method="*"] A method (*, WebServices.GET / WebServices.POST / WebServices.DELETE)
     * @param  {string} [route="*"]  A route (*, :/my/route/)
     * @param  {int} authLevel  An authentification level
     * @param  {int} [tokenExpirationTime=0] A token expiration time in seconds, for token authentication. 0 for one time token.
     */
    registerAPI(delegate, method = "*", route = "*", authLevel = Authentication.AUTH_USAGE_LEVEL, tokenExpirationTime = 0) {
        let found = false;
        let registration = new APIRegistration.class(delegate, method, route, authLevel, this.getRouteIdentifier(route), tokenExpirationTime);

        this.delegates.forEach((d) => {
            if (d.isEqual(registration)) {
                found = true;
                return;
            }
        });
        if (!found) {
            super.register(registration);
            // Sort
            this.delegates = this.delegates.sort((a) => {
                let r = 1;
                if (a.delegate instanceof Authentication.class) {
                    r = -1;
                }
                return r;
            });
        } else {
            Logger.warn("Delegate already registered (" + route + ")");
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
     * @param  {Response} res        The WS response
     * @returns {APIRequest}         An API Request
     */
    manageResponse(req, endpoint, res) {
        let method = req.method;
        let ip = null;
        if (req.ip) {
            const ipSplit = req.ip.split(":");
            ip = ipSplit[(ipSplit.length - 1)];
            if (ip === "1") {
                ip = "127.0.0.1";
            }
        }
        let route = req.path.replace(endpoint, "");
        let path = route.split("/");
        let action = null;
        let params = {};
        let apiRegistration = null;

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

            try {
                this.delegates.forEach((delegate) => {
                    const rb = delegate.getRouteBase();
                    if ((":/" + route).startsWith(rb)) {
                        apiRegistration = delegate;
                        throw BreakException;
                    }
                });
            } catch(e) {
                if (e != BreakException) {
                    Logger.err(e);
                }
            }


        }

        let methodConstant = null;
        if (method === GET) {
            params = Object.assign(params, req.query);
            methodConstant = GET;
        }

        if (method === POST && req.headers[CONTENT_TYPE] === HEADER_APPLICATION_FORM) {
            params = Object.assign(params, req.body);
            methodConstant = POST;
        }

        if (method === DELETE) {
            params = Object.assign(params, req.body);
            methodConstant = DELETE;
        }

        let data = {};

        if (method === "POST" && req.headers[CONTENT_TYPE] === HEADER_APPLICATION_JSON && req.body) {
            methodConstant = POST;
            params = Object.assign(params, req.body);

            // If application/json header
            if (req.body.data) {
                data = req.body[DATA_FIELD];
                delete params[DATA_FIELD];
            } else {
                Logger.warn("Empty body content");
            }
        }

        Logger.info(method + " " + req.path + " from " + ip + " " + ((req.headers && req.headers[CONTENT_TYPE]) ? req.headers[CONTENT_TYPE] : ""));
        return new APIRequest.class(methodConstant, ip, route, path, action, params, req, res, data, apiRegistration);
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
                    let p;
                    if (registeredEl.parameters && registeredEl.parameters.length > 0) {
                        // This code part is looking for URL parameters (dynamic) like /endpoint/[parameter]/
                        Logger.info("Parameters found " + JSON.stringify(registeredEl.parameters));
                        if ((apiRequest.path.length + 1) >= (registeredEl.routeBase.length - registeredEl.nbParametersOptional)) {
                            let baseIndex = registeredEl.routeBase.length - registeredEl.parameters.length -1; // -1 fot action (removed)
                            for (let i = 0 ; i < registeredEl.parameters.length ; i++) {
                                if (!apiRequest.data[registeredEl.parameters[i].name]) {
                                    apiRequest.data[registeredEl.parameters[i].name] = apiRequest.path[i+baseIndex]?apiRequest.path[i+baseIndex]:null;
                                }
                            }
                            try {
                                p = registeredEl.delegate.processAPI(apiRequest);
                            } catch(e) {
                                Logger.err(e.message);
                                p = new Promise((resolve, reject) => {
                                    reject(new APIResponse.class(false, {}, 7298, "Oops something wrong occurred"));
                                });
                            }
                        } else {
                            p = new Promise((resolve, reject) => {
                                let parameters = [];
                                registeredEl.parameters.forEach((parameter) => {
                                    if (parameter.optional) {
                                        parameters.push(parameter.name + " (optional)");
                                    } else {
                                        parameters.push(parameter.name);
                                    }
                                });
                                reject(new APIResponse.class(false, {}, 7258, "Invalid parameters. Expected : " + parameters.join(", ")));
                            });
                        }
                    } else {
                        p = registeredEl.delegate.processAPI(apiRequest);
                    }

                    if (!p) {
                        Logger.err("Error in web service api response");
                        p = new Promise((resolve) => {
                            resolve(new APIResponse.class(true, {}));
                        });
                    }

                    if (p instanceof Array) {
                        p.forEach((pElement) => {
                            promises.push(pElement);
                        });
                    } else {
                        promises.push(p);
                    }
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
                if (apiResponse.stack) {
                    Logger.err(apiResponse.stack);
                }

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

        // Only authentication has been registered, so it's unknown API
        if (apiResponses.length === 1 && apiResponse.success && !process.env.TEST) {
            apiResponse = new APIResponse.class(false, {}, 1, "Unknown api called");
        }


        if (!res.headersSent) {
            if (apiResponse.success) {
                if (apiResponse.upToDate) {
                    res.status(API_UP_TO_DATE).send();
                } else if (!apiResponse.contentType || (apiResponse.contentType === APIResponse.JSON_CONTENT_TYPE)) {
                    res.json(apiResponse.response);
                } else {
                    res.setHeader("Content-Type", apiResponse.contentType);
                    res.end(apiResponse.response, "binary");
                }
            } else {
                res.status(API_ERROR_HTTP_CODE).json({"code":apiResponse.errorCode,"message":apiResponse.errorMessage, "data":apiResponse.response});
            }
        }
    }

    /**
     * Get the endpoint Apis
     *
     * @returns {string} The endpoint API
     */
    getEndpointApi() {
        return ENDPOINT_API;
    }

    /**
     * Set authentication module
     *
     * @param  {Authentication} authentication             The authentication module
     */
    setAuthentication(authentication) {
        this.authentication = authentication;
    }

    /**
     * Generates a token
     *
     * @param  {string} route           The route
     * @param  {int} [expirationTime=0] Expiration time in sec - 0 for one time usage
     * @returns {string}                   The token
     */
    getToken(route, expirationTime = 0) {
        if (this.authentication) {
            return this.authentication.generateToken(null, this.getRouteIdentifier(route), expirationTime);
        }

        return null;
    }
}

module.exports = {class:WebServices, CONTENT_TYPE:CONTENT_TYPE,
    HEADER_APPLICATION_JSON:HEADER_APPLICATION_JSON, HEADER_APPLICATION_FORM:HEADER_APPLICATION_FORM,
    API_ERROR_HTTP_CODE:API_ERROR_HTTP_CODE,
    API_UP_TO_DATE:API_UP_TO_DATE,
    GET:GET,
    POST:POST,
    DELETE:DELETE,
    ENDPOINT_API:ENDPOINT_API
};
