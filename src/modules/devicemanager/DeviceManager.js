"use strict";
// const Logger = require("./../../logger/Logger");
const DeviceForm = require("./DeviceForm");
const FormConfiguration = require("./../formconfiguration/FormConfiguration");
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");
const Radio = require("./../../internal-plugins/radio/plugin");
const Tile = require("./../dashboardmanager/Tile");
const DevicesListForm = require("./DevicesListForm");
const DevicesListScenarioForm = require("./DevicesListScenarioForm");
const Icons = require("./../../utils/Icons");

const STATUS_ON = "on";
const STATUS_OFF = "off";
const ROUTE_ALL_ON = "/devices/allon/";
const ROUTE_ALL_OFF = "/devices/alloff/";

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
     * @param  {ScenarioManager} scenarioManager    The scenario manager
     * @param  {TranslateManager} translateManager    The translate manager
     * @returns {DeviceManager}              The instance
     */
    constructor(confManager, formManager, webServices, radioManager, dashboardManager, scenarioManager, translateManager) {
        this.formConfiguration = new FormConfiguration.class(confManager, formManager, webServices, "devices", true, DeviceForm.class);
        this.radioManager = radioManager;
        this.dashboardManager = dashboardManager;
        this.scenarioManager = scenarioManager;
        this.formManager = formManager;
        this.translateManager = translateManager;

        webServices.registerAPI(this, WebServices.POST, ":/device/set/[id]/[status*]/", Authentication.AUTH_USAGE_LEVEL);
        webServices.registerAPI(this, WebServices.POST, ":" + ROUTE_ALL_ON, Authentication.AUTH_USAGE_LEVEL);
        webServices.registerAPI(this, WebServices.POST, ":" + ROUTE_ALL_OFF, Authentication.AUTH_USAGE_LEVEL);
        this.registerDeviceTiles();
        this.registerDeviceListForm();

        // Register to form configuration callback
        this.formConfiguration.setUpdateCb(() => {
            this.registerDeviceListForm();
        });

        const self = this;
        this.scenarioManager.register(DevicesListScenarioForm.class, (scenario) => {
            self.triggerScenario(scenario, self);
        }, "devices.list.scenario.title");
    }

    /**
     * Trigger scenario elements
     *
     * @param  {Object} scenario A dynamic scenario object
     * @param  {DeviceManager} context  The context
     */
    triggerScenario(scenario, context) {
        if (scenario && scenario.DevicesListScenarioForm) {
            if (scenario.DevicesListScenarioForm.turnOnAll) {
                context.switchAll(STATUS_ON);
            }

            if (scenario.DevicesListScenarioForm.turnOffAll) {
                context.switchAll(STATUS_OFF);
            }

            if (scenario.DevicesListScenarioForm.devices && scenario.DevicesListScenarioForm.devices.length > 0) {
                scenario.DevicesListScenarioForm.devices.forEach((scenarioDevice) => {
                    context.switchDevice(scenarioDevice.identifier, scenarioDevice.status);
                });
            }
        }
    }

    /**
     * Register a device list form
     */
    registerDeviceListForm() {
        const devicesName = [];
        const devicesId = [];
        this.formConfiguration.data.forEach((device) => {
            devicesName.push(device.name);
            devicesId.push(device.id);
        });
        this.formManager.register(DevicesListForm.class, devicesName, devicesId);
    }

    /**
     * Register all devices on dashboard to get tiles on UI
     */
    registerDeviceTiles() {
        // Devices tiles
        this.formConfiguration.data.forEach((device) => {
            this.registerDeviceTile(device);
        });

        // All on tile
        const tileAllOn = new Tile.class(this.dashboardManager.themeManager, "all-on", Tile.TILE_GENERIC_ACTION, Icons.class.list()["off"], null, this.translateManager.t("device.manager.allon"), null, null, null, null, 10300, ROUTE_ALL_ON, null);
        this.dashboardManager.registerTile(tileAllOn);
        // All off tile
        const tileAllOff = new Tile.class(this.dashboardManager.themeManager, "all-off", Tile.TILE_GENERIC_ACTION, Icons.class.list()["_456"], null, this.translateManager.t("device.manager.alloff"), null, null, null, null, 10200, ROUTE_ALL_OFF, null);
        this.dashboardManager.registerTile(tileAllOff);
    }

    /**
     * Register a device on dashboard
     *
     * @param  {DeviceForm} device A device
     */
    registerDeviceTile(device) {
        if (device.visible) {
            const tile = new Tile.class(this.dashboardManager.themeManager, device.id, Tile.TILE_GENERIC_ACTION_STATUS, device.icon.icon, null, device.name, null, null, null, device.status > 0?1:0, 9000 + this.formConfiguration.data.indexOf(device), "/device/set/" + device.id + "/", null);
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

        this.formConfiguration.getDataCopy().forEach((device) => {
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
     * Switch all devices depending on excludeAll flag
     *
     * @param  {string} status The status
     */
    switchAll(status) {
        const self = this;

        this.formConfiguration.getDataCopy().forEach((device) => {
            if (!device.excludeFromAll) {
                self.switchDevice(device.id, status);
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
        const self = this;
        if (apiRequest.route.startsWith( ":/device/set/")) {
            return new Promise((resolve) => {
                self.switchDevice(apiRequest.data.id, apiRequest.data.status);
                resolve(new APIResponse.class(true, {success:true}));
            });
        } else if (apiRequest.route ===  ":" + ROUTE_ALL_ON) {
            return new Promise((resolve) => {
                self.switchAll(STATUS_ON);
                resolve(new APIResponse.class(true, {success:true}));
            });
        } else if (apiRequest.route ===  ":" + ROUTE_ALL_OFF) {
            return new Promise((resolve) => {
                self.switchAll(STATUS_OFF);
                resolve(new APIResponse.class(true, {success:true}));
            });
        }
    }
}

module.exports = {class:DeviceManager, STATUS_ON:STATUS_ON, STATUS_OFF:STATUS_OFF};
