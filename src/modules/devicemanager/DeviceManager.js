"use strict";
// const Logger = require("./../../logger/Logger");
const DeviceForm = require("./DeviceForm");
const FormConfiguration = require("./../formconfiguration/FormConfiguration");
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");
const Radio = require("./../../internal-plugins/radio/plugin");
const Tile = require("./../dashboardmanager/Tile");

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
     * @param  {DashboardManager} dashboardManager The dashboard manager
     * @returns {DeviceManager}              The instance
     */
    constructor(confManager, formManager, webServices, radioManager, dashboardManager) {
        this.formConfiguration = new FormConfiguration.class(confManager, formManager, webServices, "devices", true, DeviceForm.class);
        this.radioManager = radioManager;
        this.dashboardManager = dashboardManager;

        webServices.registerAPI(this, WebServices.POST, ":/device/set/[id]/[status*]/", Authentication.AUTH_USAGE_LEVEL);
        this.registerDeviceTiles();
    }

    /**
     * Register all devices on dashboard to get tiles on UI
     */
    registerDeviceTiles() {
        this.formConfiguration.data.forEach((device) => {
            this.registerDeviceTile(device);
        });
    }

    /**
     * Register a device on dashboard
     *
     * @param  {DeviceForm} device A device
     */
    registerDeviceTile(device) {
        //constructor(themeManager, identifier, type = TILE_INFO_ONE_TEXT, icon = null, subIcon = null, text = null, subText = null, picture = null, pictures = null, status = 0, order = 1, action = null, object = null) {
        if (device.visible) {
            const tile = new Tile.class(this.dashboardManager.themeManager, device.id, Tile.TILE_GENERIC_ACTION_STATUS, device.icon, null, device.name, null, null, null, device.status > 0?1:0, 9000 + this.formConfiguration.data.indexOf(device), null, null);
            this.dashboardManager.registerTile(tile);
        }
    }

    /**
     * Switch a device radio status
     *
     * @param  {number} id            A device identifier
     * @param  {string} [status=null] A status  (`on`, `off` or radio status)
     */
    switchDevice(id, status = null) {
        if (status && status.toLowerCase() === STATUS_ON) {
            status = Radio.STATUS_ON;
        } else if (status && status.toLowerCase() === STATUS_OFF) {
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
                    this.registerDeviceTile(device); // Save to dashboard !
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

module.exports = {class:DeviceManager, STATUS_ON:STATUS_ON, STATUS_OFF:STATUS_OFF};
