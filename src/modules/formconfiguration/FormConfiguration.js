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

const ERROR_EMPTY_DATA = "No data request";

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
        this.additionalFields = [];
        this.updateCb = null;
        this.sortFunction = null;

        // WebServices
        this.formRoute = ":/" + ROUTE_BASE_PATH + "/" + this.name + "/" + ROUTE_BASE_FORM + "/";
        this.getRoute = ":/" + ROUTE_BASE_PATH + "/" + this.name + "/" + ROUTE_BASE_GET + "/";
        this.setRoute = ":/" + ROUTE_BASE_PATH + "/" + this.name + "/" + ROUTE_BASE_SET + "/";
        this.delRoute = ":/" + ROUTE_BASE_PATH + "/" + this.name + "/" + ROUTE_BASE_DEL + "/[id*]/";


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

        this.loadConfig();
    }

    /**
     * Set the update callback. Called back when delete or save action is done.
     *
     * @param {Function} cb A callback with data as parameter, e.g. `cb(data) => {}`
     */
    setUpdateCb(cb) {
        this.updateCb = cb;
    }

    /**
     * Add additional fields
     *
     * @param {Class} form A form
     * @param {string} title The form title
     * @param {boolean} isList `true` if this is a list of objects, otherwise `false`
     * @param  {...Object} inject Parameters injection on static methods
     */
    addAdditionalFields(form, title, isList, ...inject) {
        if (this.additionalFields.indexOf(form) === -1 && this.formClass) {
            this.formManager.register(form, ...inject);
            this.additionalFields.push(form);
            this.formManager.addAdditionalFields(this.formClass, title, [form], isList);
        }
    }

    /**
     * Load configuration (data from file)
     */
    loadConfig() {
        // Conf manager
        try {
            this.data = this.confManager.loadData(this.formClass, this.confKey, true);
            if (!this.list) {
                this.data.id = 0;
            }
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
                    this.data = this.confManager.setData(this.confKey, d, this.data, this.comparator);
                });

            } else {
                this.data = this.confManager.setData(this.confKey, data, this.data, this.comparator);
            }
        } else {
            this.data = this.confManager.setData(this.confKey, new (this.formClass)().json(data));
        }
    }

    /**
     * Save data
     */
    save() {
        this.saveConfig(this.data);
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
                let form = self.getForm();
                if (this.data) {
                    form.data = ((this.data instanceof Array) && this.sortFunction)?this.data.sort(this.sortFunction):this.data;
                } else {
                    form.data = {};
                }
                return new Promise((resolve) => {
                    resolve(new APIResponse.class(true, form));
                });
            } else if (apiRequest.route === this.setRoute) {
                if (apiRequest.data && Object.keys(apiRequest.data).length > 0) {
                    this.saveConfig(apiRequest.data);
                    if (this.updateCb) this.updateCb(self.data);
                    return new Promise((resolve) => {
                        resolve(new APIResponse.class(true, {success:true}));
                    });
                } else {
                    if (this.updateCb) this.updateCb(self.data);
                    return new Promise((resolve, reject) => {
                        reject(new APIResponse.class(false, {}, 8106, ERROR_EMPTY_DATA));
                    });
                }
            } else if (apiRequest.route === this.getRoute) {
                if (this.data) {
                    return new Promise((resolve) => {
                        resolve(new APIResponse.class(true, ((this.data instanceof Array) && this.sortFunction)?this.data.sort(this.sortFunction):this.data));
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
                        if (this.updateCb) this.updateCb(self.data);
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
     * Returns a copy of the data object
     *
     * @returns {Array|Object} A copy of data
     */
    getDataCopy() {
        if (this.data instanceof Array) {
            const data = [];
            this.data.forEach((d) => {
                data.push(Object.assign({}, d));
            });
            return data;
        } else {
            return Object.assign({}, this.data);
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

    /**
     * Return the form
     *
     * @returns {Object} A formatted form object
     */
    getForm() {
        return this.formManager.getForm(this.formClass);
    }

    /**
     * Set the sort function
     *
     * @param {Function} f The function
     */
    setSortFunction(f) {
        this.sortFunction = f;
    }
}

module.exports = {class:FormConfiguration, ERROR_EMPTY_DATA:ERROR_EMPTY_DATA};
