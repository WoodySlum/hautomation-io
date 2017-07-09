"use strict";
// const Logger = require("./../../logger/Logger");
const DeviceForm = require("./DeviceForm");
const FormConfiguration = require("./../formconfiguration/FormConfiguration");
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");
const Radio = require("./../../internal-plugins/radio/plugin");

const STATUS_ON = "on";
const STATUS_OFF = "off";

/**
 * This class allows to manage devices
 * @class
 */
class DeviceManager {
    /**
     * Constructor
     *
     * @param  {ConfManager} confManager  A configuration manager
     * @param  {FormManager} formManager  A form manager
     * @param  {WebServices} webServices  The web services
     * @param  {RadioManager} radioManager The radio manager
     * @returns {DeviceManager}              The instance
     */
    constructor(confManager, formManager, webServices, radioManager) {
        this.formConfiguration = new FormConfiguration.class(confManager, formManager, webServices, "devices", true, DeviceForm.class);
        this.radioManager = radioManager;

        webServices.registerAPI(this, WebServices.POST, ":/device/set/[id]/[status*]/", Authentication.AUTH_USAGE_LEVEL);
    }

    /**
     * Switch a device radio status
     *
     * @param  {number} id            A device identifier
     * @param  {string} [status=null] A status  (`on`, `off` or radio status)
     */
    switchDevice(id, status = null) {
        if (status.toLowerCase() === STATUS_ON) {
            status = Radio.STATUS_ON;
        } else if (status.toLowerCase() === STATUS_OFF) {
            status = Radio.STATUS_OFF;
        }

        this.formConfiguration.data.forEach((device) => {
            if (parseInt(device.id) === parseInt(id)) {
                let newStatus = null;
                device.radio.forEach((radio) => {
                    const radioObject = this.radioManager.switchDevice(radio.module, radio.protocol, radio.deviceId, radio.switchId, status, radio.frequency, device.status);
                    if (radioObject.status) {
                        newStatus = radioObject.status;
                    }
                });

                if (newStatus) {
                    device.status = newStatus;
                    this.formConfiguration.saveConfig(device);
                }
            }
        });
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        if (apiRequest.route.startsWith( ":/device/set/")) {
            const self = this;
            return new Promise((resolve) => {
                self.switchDevice(apiRequest.data.id, apiRequest.data.status);
                resolve(new APIResponse.class(true, {success:true}));
            });
        }
    }
}

module.exports = {class:DeviceManager};
