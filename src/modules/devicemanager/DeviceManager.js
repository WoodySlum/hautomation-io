"use strict";
var Logger = require("./../../logger/Logger");
var Device = require("./Device");
//var Authentication = require("./../authentication/Authentication");

const CONF_KEY = "devices";

/**
 * This class allows to manage devices
 * @class
 */
class DeviceManager {
    /**
     * Constructor
     *
     * @param  {ConfManager} confManager A configuration manager needed for persistence
     * @param  {WebServices} webServices The web services to register APIs
     * @returns {DeviceManager} The instance
     */
    constructor(confManager, webServices) {
        /**
         * Configuration manager
         * @type {ConfManager}
         */
        this.confManager = confManager;

        try {
            /**
             * Users
             * @type {[User]}
             */
            this.devices = this.confManager.loadData(Device.class, CONF_KEY);
            this.webServices = webServices;
        } catch(e) {
            Logger.warn("Load devices error : " + e.message);
            this.devices = [];
        }
    }
}

module.exports = {class:DeviceManager};
