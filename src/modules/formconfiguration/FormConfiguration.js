"use strict";
const Logger = require("./../../logger/Logger");
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");

const ROUTE_BASE_PATH = "conf";
const ROUTE_BASE_FORM = "form";
const ROUTE_BASE_GET = "get";
const ROUTE_BASE_SET = "set";
const ROUTE_BASE_DEL = "del";

/**
 * This class allows to manage form configuration
 * @class
 */
class FormConfiguration {
    /**
     * Constructor
     *
     * @param  {ConfManager} confManager A configuration manager
     * @param  {FormManager} formManager A form manager
     * @param  {WebServices} webServices Web services instance
     * @param  {string} name        A name or identifier
     * @param  {boolean} [list=false]     True if form configuration manage a list, false otherwise
     * @param  {Class} formClass A form annotation's implemented class. Can be called later through `register` method
     * @param  {...Object} inject Parameters injection on static methods
     * @returns {FormConfiguration}             The instance
     */
    constructor(confManager, formManager, webServices, name, list = false, formClass = null, ...inject) {
        this.confManager = confManager;
        this.formManager = formManager;
        this.webServices = webServices;
        this.name = name.toLowerCase();
        this.confKey = this.name + ".conf";
        this.list = list;

        // WebServices
        this.formRoute = ":/" + ROUTE_BASE_PATH + "/" + this.name + "/" + ROUTE_BASE_FORM + "/";
        this.getRoute = ":/" + ROUTE_BASE_PATH + "/" + this.name + "/" + ROUTE_BASE_GET + "/";
        this.setRoute = ":/" + ROUTE_BASE_PATH + "/" + this.name + "/" + ROUTE_BASE_SET + "/";
        this.delRoute = ":/" + ROUTE_BASE_PATH + "/" + this.name + "/" + ROUTE_BASE_DEL + "/[id*]";


        this.webServices.registerAPI(this, WebServices.GET, this.formRoute, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, this.getRoute, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, this.setRoute, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.DELETE, this.delRoute, Authentication.AUTH_ADMIN_LEVEL);

        if (this.list) {
            this.data = [];
        } else {
            this.data = null;
        }

        if (formClass) {
            this.registerForm(formClass, ...inject);
        } else {
            this.formClass = null;
        }
    }

    /**
     * Load configuration (data from file)
     */
    loadConfig() {
        // Conf manager
        try {
            this.data = this.confManager.loadData(this.formClass, this.confKey);
        } catch(e) {
            Logger.warn("Load config for " + this.name + " error : " + e.message);
        }
    }

    /**
     * Save configuration
     *
     * @param  {Object} data Object data
     */
    saveConfig(data) {
        if (!data.id) {
            data.id = Math.floor(Date.now() + (Math.random()*100));
        }
        if (this.list) {
            if (data instanceof Array) {
                data.forEach((d) => {
                    this.data = this.confManager.setData(this.confKey, new (this.formClass)().json(d), this.data, this.comparator);
                });

            } else {
                this.data = this.confManager.setData(this.confKey, new (this.formClass)().json(data), this.data, this.comparator);
            }
        } else {
            this.data = this.confManager.setData(this.confKey, new (this.formClass)().json(data));
        }
    }

    /**
     * List comparator for ConfManager
     *
     * @param  {Object} obj1 An first object
     * @param  {Object} obj2 A second object
     * @returns {boolean}      True if equals, false otherwise
     */
    comparator(obj1, obj2) {
        return (obj1.id === obj2.id);
    }

    /**
     * Register a form shortcut
     *
     * @param  {Class} formClass A form annotation's implemented class
     * @param  {...Object} inject    The inject objects
     */
    registerForm(formClass, ...inject) {
        this.formClass = formClass;
        this.formManager.register(formClass, ...inject);
        this.loadConfig();
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        const self = this;
        if (this.formClass) {
            // Get form
            if (apiRequest.route === this.formRoute) {
                let form = self.formManager.getForm(self.formClass);
                if (this.data) {
                    form.data = this.data;
                } else {
                    form.data = {};
                }
                return new Promise((resolve) => {
                    resolve(new APIResponse.class(true, form));
                });
            } else if (apiRequest.route === this.setRoute) {
                this.saveConfig(apiRequest.data);
                return new Promise((resolve) => {
                    resolve(new APIResponse.class(true, {success:true}));
                });
            } else if (apiRequest.route === this.getRoute) {
                if (this.data) {
                    return new Promise((resolve) => {
                        resolve(new APIResponse.class(true, this.data));
                    });
                }  else {
                    return new Promise((resolve, reject) => {
                        reject(new APIResponse.class(false, {}, 800, "No data"));
                    });
                }
            } else if (apiRequest.route.startsWith(":/" + ROUTE_BASE_PATH + "/" + this.name + "/" + ROUTE_BASE_DEL + "/")) {
                if (apiRequest.data && apiRequest.data.id) {
                    return new Promise((resolve) => {
                        self.confManager.removeData(self.confKey, new (this.formClass)(apiRequest.data.id), self.data, self.comparator);
                        resolve(new APIResponse.class(true, {success:true}));
                    });
                } else {
                    return new Promise((resolve, reject) => {
                        reject(new APIResponse.class(false, {}, 802, "No data"));
                    });
                }
            }
        } else {
            return new Promise((resolve, reject) => {
                reject(new APIResponse.class(false, {}, 801, "No form defined"));
            });
        }
    }

    /**
     * Return configuration
     *
     * @returns {Object} A configuration
     */
    getConfig() {
        return this.data;
    }
}

module.exports = {class:FormConfiguration};
