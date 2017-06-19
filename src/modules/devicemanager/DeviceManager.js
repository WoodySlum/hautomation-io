/* eslint-disable */
"use strict";
var Logger = require("./../../logger/Logger");
var Device = require("./Device");
var WebServices = require("./../../services/webservices/WebServices");
var Authentication = require("./../authentication/Authentication");
var APIResponse = require("../../services/webservices/APIResponse");

const CONF_KEY = "devices";
const ROUTE_GET_METHOD = ":/devices/get/";
const ROUTE_POST_METHOD = ":/devices/set/";
// /api/devices/id/status/
const ROUTE_POST_STATUS_METHOD = ":/devices/status/";

/**
 * This class allows to manage devices
 * @class
 */
class DeviceManager {
    /**
     * Constructor
     *
     * @param  {ConfManager} confManager A configuration manager needed for persistence
     * @param  {PluginsManager} pluginsManager The plugins manager
     * @param  {WebServices} webServices The web services to register APIs
     * @returns {DeviceManager} The instance
     */
    constructor(confManager, pluginsManager, webServices) {
        this.confManager = confManager;
        this.webServices = webServices;
        this.pluginsManager = pluginsManager;

        try {
            this.devices = this.confManager.loadData(Device.class, CONF_KEY);
        } catch(e) {
            Logger.warn("Load devices error : " + e.message);
            this.devices = [];
        }

        // Register APIs
        this.webServices.registerAPI(this, WebServices.GET, ROUTE_GET_METHOD, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, ROUTE_POST_METHOD, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, ROUTE_POST_STATUS_METHOD, Authentication.AUTH_USAGE_LEVEL);
    }

    deviceComparator(device1, device2) {
        return device1.id === device2.id;
    }

    /**
     * Set device from a generic JSON object
     *
     * @param {Object} object The JSON object
     */
    setDevice(object) {
        Logger.info("Saving device");
        const device = new Device.class().json(object);
        this.confManager.setData(CONF_KEY, device, this.devices, this.deviceComparator);
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
                resolve(new APIResponse.class(true, this.devices));
            });
        }

        if (apiRequest.method === WebServices.POST && apiRequest.route === ROUTE_POST_METHOD) {
            return new Promise((resolve) => {
                this.setDevice(apiRequest.data);
                resolve(new APIResponse.class(true, this.devices));
            });
        }

        if (apiRequest.method === WebServices.POST && apiRequest.route.startsWith(ROUTE_POST_STATUS_METHOD)) {
            return new Promise((resolve) => {
                if (apiRequest.path.length == 3) {
                    const id = apiRequest.path[1];
                    const status = apiRequest.path[2];

                    // Get data
                    let device = this.confManager.getData(this.devices, new Device.class(id), this.deviceComparator);
                    this.changeStatus(device, status);
                    resolve(new APIResponse.class(true, this.devices));
                } else {
                    resolve(new APIResponse.class(false, {}, 819, "Invalid API call. Needed id and status"));
                }
            });
        }
    }

    changeStatus(device, status) {

    }
}

module.exports = {class:DeviceManager};
