"use strict";
const Logger = require("./../../logger/Logger");
const DeviceForm = require("./DeviceForm");
const FormConfiguration = require("./../formconfiguration/FormConfiguration");
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");
const Tile = require("./../dashboardmanager/Tile");
const DevicesListForm = require("./DevicesListForm");
const DevicesListScenarioForm = require("./DevicesListScenarioForm");
const Icons = require("./../../utils/Icons");
const DeviceStatus = require("./DeviceStatus");

const DEVICE_TYPE_LIGHT = "light";
const DEVICE_TYPE_LIGHT_DIMMABLE = "light-dimmable";
const DEVICE_TYPE_LIGHT_DIMMABLE_COLOR = "light-dimmable-color";
const DEVICE_TYPE_SHUTTER = "shutter";

const STATUS_ON = "on";
const STATUS_OFF = "off";
const INT_STATUS_ON = 1;
const INT_STATUS_OFF = -1;
const STATUS_INVERT = "invert";
const ROUTE_ALL_ON = "/devices/allon/";
const ROUTE_ALL_OFF = "/devices/alloff/";
const DEVICE_NAME_COMPARE_CONFIDENCE = 0.31;
const EVENT_UPDATE_CONFIG_DEVICES = "update-config-devices";

const ITEM_CHANGE_STATUS = "status";
const ITEM_CHANGE_BRIGHTNESS = "brightness";
const ITEM_CHANGE_COLOR = "color";
const ITEM_CHANGE_COLOR_TEMP = "color-temperature";
const DEVICE_COLORS = [
    "FFFFFF",
    "EEEEEE",
    "f44336",
    "e91e63",
    "9c27b0",
    "673ab7",
    "3f51b5",
    "2196f3",
    "03a9f4",
    "00bcd4",
    "009688",
    "4caf50",
    "8bc34a",
    "cddc39",
    "ffeb3b",
    "ffc107",
    "ff9800",
    "ff5722",
    "795548",
    "607d8b",
];

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
     * @param  {EnvironmentManager} environmentManager    The environment manager
     * @param  {BotEngine} botEngine    The bot engine
     * @param  {SensorsManager} sensorsManager    The sensrsManager
     * @param  {EventEmitter} eventBus    The global event bus
     * @returns {DeviceManager}              The instance
     */
    constructor(confManager, formManager, webServices, radioManager, dashboardManager, scenarioManager, translateManager, environmentManager, botEngine, sensorsManager, eventBus) {
        this.formConfiguration = new FormConfiguration.class(confManager, formManager, webServices, "devices", true, DeviceForm.class);
        this.radioManager = radioManager;
        this.dashboardManager = dashboardManager;
        this.scenarioManager = scenarioManager;
        this.formManager = formManager;
        this.translateManager = translateManager;
        this.environmentManager = environmentManager;
        this.botEngine = botEngine;
        this.sensorsManager = sensorsManager;
        this.eventBus = eventBus;
        this.switchDeviceModules = {};

        this.radioManager.deviceManager = this; // Set the device manager. used to associate devices to received radio objects

        webServices.registerAPI(this, WebServices.POST, ":/device/set/[id]/[status*]/[brightness*]/[color*]/[colorTemperature*]/", Authentication.AUTH_USAGE_LEVEL);
        webServices.registerAPI(this, WebServices.POST, ":" + ROUTE_ALL_ON, Authentication.AUTH_USAGE_LEVEL);
        webServices.registerAPI(this, WebServices.POST, ":" + ROUTE_ALL_OFF, Authentication.AUTH_USAGE_LEVEL);

        this.registerDeviceTiles();
        this.registerDeviceListForm();

        // Register to form configuration callback
        this.formConfiguration.setUpdateCb((obj) => {
            this.registerDeviceTiles();
            this.registerDeviceListForm();
            this.eventBus.emit(EVENT_UPDATE_CONFIG_DEVICES, obj);
        });

        const self = this;
        this.scenarioManager.register(DevicesListScenarioForm.class, (scenario) => {
            self.triggerScenario(scenario, self);
        }, "devices.list.scenario.title");

        this.botEngine.registerBotAction("turnon", (action, value, type, confidence, sender, cb) => {
            let maxConfidence = 0;
            let detectedDevice = null;
            self.formConfiguration.getDataCopy().forEach((device) => {
                const stringConfidence = this.botEngine.stringSimilarity().compareTwoStrings(device.name, value);
                Logger.info("Confidence " + value + " | " + device.name + ": " + stringConfidence);
                if (stringConfidence >= DEVICE_NAME_COMPARE_CONFIDENCE && stringConfidence > maxConfidence) {
                    detectedDevice = device;
                    maxConfidence = stringConfidence;
                }
            });

            if (detectedDevice) {
                Logger.info("Match found ! : " + detectedDevice.name);
                self.switchDevice(detectedDevice.id, STATUS_ON);
                cb(this.translateManager.t("devices.bot.turnon", detectedDevice.name));
            } else {
                cb(this.translateManager.t("devices.bot.notfound"));
            }
        });

        this.botEngine.registerBotAction("turnoff", (action, value, type, confidence, sender, cb) => {
            let maxConfidence = 0;
            let detectedDevice = null;
            self.formConfiguration.getDataCopy().forEach((device) => {
                const stringConfidence = this.botEngine.stringSimilarity().compareTwoStrings(device.name, value);
                Logger.info("Confidence " + value + " | " + device.name + ": " + stringConfidence);
                if (stringConfidence >= DEVICE_NAME_COMPARE_CONFIDENCE && stringConfidence > maxConfidence) {
                    detectedDevice = device;
                    maxConfidence = stringConfidence;
                }
            });

            if (detectedDevice) {
                Logger.info("Match found ! : " + detectedDevice.name);
                self.switchDevice(detectedDevice.id, STATUS_OFF);
                cb(this.translateManager.t("devices.bot.turnoff", detectedDevice.name));
            } else {
                cb(this.translateManager.t("devices.bot.notfound"));
            }
        });

        this.formConfiguration.setSortFunction((a,b) => a.name.localeCompare(b.name));

        // Fix #56 - Refactor devices and radio
        // The radio manager will add the good radio form instead of adding statically
        this.radioManager.registerDeviceManagerForm(this);
    }

    /**
     * Add a form device part
     *
     * @param {string}  key          A key
     * @param {Form}  form           A form
     * @param {string}  title          A title
     * @param {boolean} [isList=false] `true` if this is a list of subforms, `false` otherwise
     */
    addForm(key, form, title, isList = false) {
        delete this.switchDeviceModules[key];
        this.switchDeviceModules[key] = {};
        this.switchDeviceModules[key].formName = form.prototype.constructor.name;
        this.formManager.addAdditionalFields(DeviceForm.class, title, [form], isList);
    }

    /**
     * Register a switch device function
     * The method `addForm` should be called before
     *
     * @param  {string}   key A key, the same as set in `addForm`
     * @param  {Function} cb  The callback when a device switches `(device, formData, deviceStatus) => {}`. Please note that this callback can return a DeviceStatus object to save state. You can modify and return the status as parameter.
     * @param  {string} [type=DEVICE_TYPE_LIGHT]  The device type, constant can be `DEVICE_TYPE_LIGHT`, `DEVICE_TYPE_LIGHT_DIMMABLE`, `DEVICE_TYPE_LIGHT_DIMMABLE_COLOR`, `DEVICE_TYPE_SHUTTER`
     */
    registerSwitchDevice(key, cb, type = DEVICE_TYPE_LIGHT) {
        if (!this.switchDeviceModules[key]) {
            throw Error("You must call addForm before calling registerSwitchDevice. A form must be added in order to identify which callback should be processed.");
        }
        this.switchDeviceModules[key].type = type;
        this.switchDeviceModules[key].switch = cb;

        // Update tiles for device types
        this.registerDeviceTiles();
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
                    context.switchDevice(scenarioDevice.identifier, scenarioDevice.status, scenarioDevice.brightness, scenarioDevice.color);
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
        this.formConfiguration.data.sort((a,b) => a.name.localeCompare(b.name)).forEach((device) => {
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
        let data = this.formConfiguration.data.sort((a,b) => a.name.localeCompare(b.name));
        data.forEach((device) => {
            this.registerDeviceTile(device, data);
        });

        // All on tile
        const tileAllOn = new Tile.class(this.dashboardManager.themeManager, "all-on", Tile.TILE_GENERIC_ACTION, Icons.class.list()["off"], null, this.translateManager.t("device.manager.allon"), null, null, null, null, 10300, ROUTE_ALL_ON, null);
        this.dashboardManager.registerTile(tileAllOn, 9600);
        // All off tile
        const tileAllOff = new Tile.class(this.dashboardManager.themeManager, "all-off", Tile.TILE_GENERIC_ACTION, Icons.class.list()["_456"], null, this.translateManager.t("device.manager.alloff"), null, null, null, null, 10200, ROUTE_ALL_OFF, null);
        this.dashboardManager.registerTile(tileAllOff, 9601);
    }

    /**
     * Return the list of devices
     *
     * @returns {Array} The list of devices
     */
    getDevices() {
        return this.formConfiguration.getDataCopy();
    }

    /**
     * Return a status of a device
     *
     * @param  {number} id            A device identifier
     * @returns {boolean} Status of the device
     */
    getDeviceStatus(id) {
        let foundDevice = null;
        this.getDevices().forEach((device) => {
            if (device.id === id) {
                foundDevice = device;
            }
        });

        return foundDevice.status;
    }

    /**
     * Register a device on dashboard
     *
     * @param  {DeviceForm} device A device
     * @param  {Array} data Some data
     * @param  {number} [index=-1] An index
     */
    registerDeviceTile(device, data = [], index = -1) {
        if (device.visible) {
            let i = (index === -1)?(9000 + data.indexOf(device)):index;
            const deviceStatus = new DeviceStatus.class(this.getDeviceTypes(device), device.status, device.brightness, device.color, device.colorTemperature);
            let deviceInfos = deviceStatus.tileFormat();
            if (deviceStatus.deviceTypes.indexOf(DEVICE_TYPE_LIGHT_DIMMABLE_COLOR) > -1) {
                deviceInfos = Object.assign(deviceInfos, {colors:DEVICE_COLORS});
            }
            const tile = new Tile.class(this.dashboardManager.themeManager, device.id, Tile.TILE_DEVICE, device.icon.icon, null, device.name, null, null, null, device.status > 0?1:0, i, "/device/set/" + device.id + "/", deviceInfos);
            this.dashboardManager.registerTile(tile);
        }
    }

    /**
     * Returns the supported modes for a specific device (e.g. light, dimmable, color, ...)
     *
     * @param  {Object} device A device
     * @returns {[string]}        The list of supported modes
     */
    getDeviceTypes(device) {
        const modes = [];
        Object.keys(this.switchDeviceModules).forEach((switchDeviceModuleKey) => {
            const switchDeviceModule = this.switchDeviceModules[switchDeviceModuleKey];
            if (device && device[switchDeviceModule.formName]) {
                if (modes.indexOf(switchDeviceModule.type) === -1) {
                    modes.push(switchDeviceModule.type);
                }
            }
        });

        return modes;
    }

    /**
     * Returns a device from an identifier
     *
     * @param  {string} id An identifier
     * @returns {Object}    A device
     */
    getDeviceById(id) {
        let found = null;
        this.getDevices().forEach((device) => {
            if (device.id == id) {
                found = device;
            }
        });

        return found;
    }

    /**
     * Switch a device status
     *
     * @param  {number} id            A device identifier
     * @param  {string} [status=null] A status  (`on`, `off` or int status)
     * @param  {int} [brightness=0] Brightness (between 0 and 1)
     * @param  {string} [color=FFFFFF] Color (hex color)
     * @param  {int} [colorTemperature=0] Color temperature (between 0 and 1)
     */
    switchDevice(id, status = null, brightness = 0, color = "FFFFFF", colorTemperature = 0) {
        color = color ? color.replace("#", "") : color; // Remove sharp
        if (typeof status === "string") {
            if (status && status.toLowerCase() === STATUS_ON) {
                status = INT_STATUS_ON;
            } else if (status && status.toLowerCase() === STATUS_OFF) {
                status = INT_STATUS_OFF;
            } else if (status && status.toLowerCase() === STATUS_INVERT) {
                status = null;
            }
        }

        this.formConfiguration.getDataCopy().forEach((device) => {
            if (parseInt(device.id) === parseInt(id)) {
                // Check for day and night mode
                if (!device.worksOnlyOnDayNight
                    || (device.worksOnlyOnDayNight === 1)
                    || (device.worksOnlyOnDayNight === 2 && !this.environmentManager.isNight())
                    || (device.worksOnlyOnDayNight === 3 && this.environmentManager.isNight())
                    || device.status === INT_STATUS_ON) {

                    let newDeviceStatus = null;
                    Object.keys(this.switchDeviceModules).forEach((switchDeviceModuleKey) => {
                        const switchDeviceModule = this.switchDeviceModules[switchDeviceModuleKey];
                        if (device[switchDeviceModule.formName]) {
                            // Detect what changed
                            const changes = [];
                            if (device.status != status) {
                                changes.push(ITEM_CHANGE_STATUS);
                            }

                            if (device.brightness != brightness) {
                                changes.push(ITEM_CHANGE_BRIGHTNESS);
                            }
                            if (device.color != color) {
                                changes.push(ITEM_CHANGE_COLOR);
                            }
                            if (device.colorTemperature != colorTemperature) {
                                changes.push(ITEM_CHANGE_COLOR_TEMP);
                            }

                            newDeviceStatus = switchDeviceModule.switch(device, device[switchDeviceModule.formName], new DeviceStatus.class(this.getDeviceTypes(device), status, brightness, color, colorTemperature, changes));
                        }
                    });

                    if (newDeviceStatus) {
                        device.status = newDeviceStatus.getStatus();
                        device.brightness = newDeviceStatus.getBrightness();
                        device.color = newDeviceStatus.getColor();
                        device.colorTemperature = newDeviceStatus.getColorTemperature();
                        this.saveDevice(device);
                    }
                } else {
                    Logger.warn("Turning device " + device.id + " is not authorized due to day / night mode. Device configuration (" + device.worksOnlyOnDayNight + "), Current mode is night (" + this.environmentManager.isNight() + "), Status (" + device.status + "), Compared status (" + INT_STATUS_ON + ")");
                }
            }
        });
    }

    /**
     * Switch device with a device object
     *
     * @param  {Object} device A device
     */
    switchDeviceWithDevice(device) {
        this.switchDevice(device.id, device.status, device.brightness, device.color);
    }

    /**
     * Save device
     *
     * @param  {Object} device A device
     */
    saveDevice(device) {
        this.formConfiguration.saveConfig(device);

        // Devices tiles
        let data = this.formConfiguration.data.sort((a,b) => a.name.localeCompare(b.name));

        this.registerDeviceTile(device, data); // Save to dashboard !
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
                self.switchDevice(apiRequest.data.id, apiRequest.data.status, apiRequest.data.brightness, apiRequest.data.color, apiRequest.data.colorTemperature);
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

module.exports = {class:DeviceManager, STATUS_ON:STATUS_ON, INT_STATUS_ON:INT_STATUS_ON, INT_STATUS_OFF:INT_STATUS_OFF, STATUS_OFF:STATUS_OFF, STATUS_INVERT:STATUS_INVERT, EVENT_UPDATE_CONFIG_DEVICES:EVENT_UPDATE_CONFIG_DEVICES, DEVICE_TYPE_LIGHT:DEVICE_TYPE_LIGHT, DEVICE_TYPE_LIGHT_DIMMABLE: DEVICE_TYPE_LIGHT_DIMMABLE, DEVICE_TYPE_LIGHT_DIMMABLE_COLOR:DEVICE_TYPE_LIGHT_DIMMABLE_COLOR, DEVICE_TYPE_SHUTTER:DEVICE_TYPE_SHUTTER, ITEM_CHANGE_STATUS:ITEM_CHANGE_STATUS, ITEM_CHANGE_BRIGHTNESS:ITEM_CHANGE_BRIGHTNESS, ITEM_CHANGE_COLOR:ITEM_CHANGE_COLOR, ITEM_CHANGE_COLOR_TEMP: ITEM_CHANGE_COLOR_TEMP};
