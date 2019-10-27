/* eslint-disable */
"use strict";
const Logger = require("./../../logger/Logger");
const RadioForm = require("./RadioForm");
const RadioScenarioForm = require("./RadioScenarioForm");
const RadioScenariosForm = require("./RadioScenariosForm");
const PluginsManager = require("./../pluginsmanager/PluginsManager");
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");
const DateUtils = require("./../../utils/DateUtils");
const sha256 = require("sha256");
const Cleaner = require("./../../utils/Cleaner");

const ROUTE_GET_BASE_PATH = ":/radio/get/";
const RADIO_PLUGIN_KEY = "radio";
const ASSOCIATED_TYPE_DEVICE = "device";
const ASSOCIATED_TYPE_SCENARIO = "scenario";
const ASSOCIATED_TYPE_SENSOR = "sensor";
const DEVICE_MODULE_KEY = "radio";

/**
 * This class manage radio stuff
 * @class
 */
class RadioManager {
    /**
     * Constructor
     *
     * @param  {PluginManager} pluginsManager A plugin manager instance
     * @param  {FormManager} formManager    A form manager
     * @param  {EventEmitter} eventBus    The global event bus
     * @param  {ScenarioManager} scenarioManager    The scenario manager
     * @param  {WebServices} webServices Web services instance
     * @param  {TranslateManager} translateManager Translate manager
     * @param  {SensorsManager} sensorsManager Sensors manager
     * @returns {RadioManager}                The instance
     */
    constructor(pluginsManager, formManager, eventBus, scenarioManager, webServices, translateManager, sensorsManager) {
        this.pluginsManager = pluginsManager;
        this.formManager = formManager;
        this.scenarioManager = scenarioManager;
        this.webServices = webServices;
        this.translateManager = translateManager;
        this.deviceManager = null;
        this.sensorsManager = sensorsManager;

        this.modules = [];
        this.protocols = [];
        this.registeredElements = {};

        const self = this;
        eventBus.on(PluginsManager.EVENT_LOADED, (pluginsManager) => {
            self.pluginsLoaded(pluginsManager, self);
        });

        this.webServices.registerAPI(this, WebServices.GET, ROUTE_GET_BASE_PATH, Authentication.AUTH_ADMIN_LEVEL);
    }

    /**
     * Register device manager
     *
     * @param  {DeviceManager} deviceManager The device manager
     */
    registerDeviceManagerForm(deviceManager) {
        const self = this;
        deviceManager.addForm(DEVICE_MODULE_KEY, RadioForm.class, "device.form.radio", true);
        deviceManager.registerSwitchDevice(DEVICE_MODULE_KEY, (device, data, deviceStatus) => {
            data.forEach((radio) => {
                const radioObject = self.switchDevice(radio.module, radio.protocol, radio.deviceId, radio.switchId, deviceStatus.status, radio.frequency, device.status);
                if (radioObject && radioObject.hasOwnProperty("status") && radioObject.status) {
                    deviceStatus.setStatus(radioObject.status);
                } else {
                    Logger.warn("Could not change device status. Maybe plugin " + radio.module + " has been disabled");
                }
            });

            return deviceStatus;
        });
    }

    /**
     * Called automatically when plugins are loaded. Used in separate methods for testing.
     * Initially, this method wad used in contructor.
     *
     * @param  {PluginsManager} pluginsManager THe plugins manager instance
     * @param  {RadioManager} context        The context (self, this, etc ...)
     */
    pluginsLoaded(pluginsManager, context) {
        context.pluginsManager = pluginsManager;
        context.getModules();
        context.getProtocols();
        context.registerRadioEvents();
        context.formManager.register(RadioForm.class, context.modules, context.protocols);
        context.formManager.register(RadioScenarioForm.class);
        context.scenarioManager.register(RadioScenariosForm.class, null, "radio.scenario.form.trigger", 200);
    }

    /**
     * Register for radio events
     *
     * @param  {Function} cb            A callback triggered when radio information is received. Example : `(radioObj) => {}`
     * @param  {string} id            An identifier
     */
    register(cb, id = null) {
        const index = sha256(cb.toString() + id);
        this.registeredElements[index] = cb;
    }

    /**
     * Unegister an timer element
     *
     * @param  {Function} cb             A callback triggered when radio information is received. Example : `(radioObj) => {}`
     * @param  {string} id            An identifier
     */
    unregister(cb, id = null) {
        const index = sha256(cb.toString() + id);
        if (this.registeredElements[index]) {
            delete this.registeredElements[index];
        } else {
            Logger.warn("Element not found");
        }
    }

    /**
     * Register for radio events
     */
    registerRadioEvents() {
        const self = this;
        this.pluginsManager.getPluginsByCategory(RADIO_PLUGIN_KEY).forEach((plugin) => {
            if (plugin.instance) {
                plugin.instance.register(self);
            }
        });
    }

    /**
     * Unregister for radio events
     */
    unregisterRadioEvents() {
        const self = this;
        this.pluginsManager.getPluginsByCategory(RADIO_PLUGIN_KEY).forEach((plugin) => {
            if (plugin.instance) {
                plugin.instance.unregister(self);
            }
        });
    }

    /**
     * Compare a `RadioScenarioForm` object and a standard received `RadioObject`
     *
     * @param  {RadioScenarioForm} radioFormObject The radio scenario form object
     * @param  {Object} radioObject     A standard radio object
     * @returns {boolean}                 `true` if objects matches, `false` otherwise
     */
    compareFormObject(radioFormObject, radioObject) {
        if (radioFormObject.radio.module === radioObject.module
            && radioFormObject.radio.module === radioObject.module
            && radioFormObject.radio.protocol === radioObject.protocol
            && radioFormObject.radio.deviceId === radioObject.deviceId
            && radioFormObject.radio.switchId === radioObject.switchId
            && ((parseFloat(radioFormObject.status) === parseFloat(RadioScenarioForm.STATUS_ALL)) || (parseFloat(radioFormObject.status) === parseFloat(radioObject.status)))
        ) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Callback when radio informations are received
     * When a new radio information is received, refresh protocols list for forms
     *
     * @param  {DbRadio} radioObject A radio object
     */
    onRadioEvent(radioObject) {
        // Trigger scenarios
        this.scenarioManager.getScenarios().forEach((scenario) => {
            if (scenario.RadioScenariosForm) {
                if (scenario.RadioScenariosForm.radioScenariosForm) {
                    let shouldExecuteAction = false;
                    scenario.RadioScenariosForm.radioScenariosForm.forEach((radioScenarioForm) => {
                        if (radioScenarioForm.radio) {
                            if (this.compareFormObject(radioScenarioForm, radioObject)) {
                                shouldExecuteAction = true;
                            }
                        }
                    });

                    if (shouldExecuteAction) {
                        this.scenarioManager.triggerScenario(scenario);
                    }
                }
            }
        });

        // Update protocols
        if (this.protocols.indexOf(radioObject.protocol) === -1) {
            this.getProtocols();
        }

        // Dispatch callback
        Object.keys(this.registeredElements).forEach((registeredKey) => {
            this.registeredElements[registeredKey](Cleaner.class.cleanDbObject(radioObject));
        });
    }

    /**
     * Retrieves the list of modules, store in property, and register form
     */
    getModules() {
        this.modules = [];
        const self = this;
        this.pluginsManager.getPluginsByCategory(RADIO_PLUGIN_KEY).forEach((plugin) => {
            if (plugin.instance) {
                self.modules.push(plugin.instance.module);
                self.formManager.register(RadioForm.class, this.modules, this.protocols);
            }
        });
    }

    /**
     * Retrieves the list of protocols, store in property, and register form
     */
    getProtocols() {
        this.protocols = [];
        const self = this;
        this.pluginsManager.getPluginsByCategory(RADIO_PLUGIN_KEY).forEach((plugin) => {
            if (plugin.instance) {
                plugin.instance.getProtocolList((err, res) => {
                    if (!err) {
                        for (let i = 0 ; i < res.length ; i++) {
                            if (self.protocols.indexOf(res[i]) === -1) {
                                self.protocols.push(res[i]);
                            }
                        }
                        self.formManager.register(RadioForm.class, this.modules, this.protocols);
                    }
                });
            }
        });
    }

    /**
     * Emit radio request
     *
     * @param  {number} frequency The frequency
     * @param  {string} protocol  The protocol
     * @param  {string} deviceId  The device ID
     * @param  {string} switchId  The switch ID
     * @param  {number} [status=null]    The status (or enum called through `constants()`)
     * @param  {number} [previousStatus=null]    The previous object status, used if status is null to invert
     * @returns {DbRadio}           A radio  object
     */
    switchDevice(module, protocol, deviceId, switchId, status = null, frequency = null, previousStatus = null) {
        const plugin = this.pluginsManager.getPluginByIdentifier(module);

        if (plugin) {
            return plugin.instance.emit(frequency, protocol, deviceId, switchId, status, previousStatus);
        } else {
            return null;
        }
    }

    /**
     * Get last received radio informations
     *
     * @param  {Function} cb               A callback `cb(radioObjects) => {}`
     * @param  {number}   [nbElements=100] Number of elements
     */
    getLastReceivedRadioInformations(cb, nbElements = 100) {
        const plugins = this.pluginsManager.getPluginsByCategory(RADIO_PLUGIN_KEY);
        let c = 0;
        const radioObjects = [];
        plugins.forEach((plugin) => {
            plugin.instance.getLastReceivedRadioInformations((err, objects) => {
                c++;
                if (!err) {
                    objects.forEach((obj) => {
                        radioObjects.push(obj);
                    });
                }
                if (c === plugins.length) {
                    cb(radioObjects);
                }
            }, nbElements);
        });

        if (plugins.length === 0) {
            cb(radioObjects);
        }
    }

    /**
     * Get the associated items for specific radio informations
     *
     * @param  {string} module   The radio module
     * @param  {string} protocol The radio protocol
     * @param  {string} switchId The radio switch id
     * @param  {string} deviceId The radio device id
     * @param  {string} status   The radio status
     * @return {Array}          An array ob objects containing 3 properties : `type`, `id` and `name`
     */
    getAssociatedItems(module, protocol, switchId, deviceId, status) {
        const associatedItems = [];

        // Device part
        if (this.deviceManager) {
            this.deviceManager.getDevices().forEach((device) => {
                if (device.RadioForm) {
                    device.RadioForm.forEach((deviceRadio) => {
                        if (deviceRadio.module === module
                            && deviceRadio.protocol === protocol
                            && deviceRadio.deviceId === deviceId
                            && deviceRadio.switchId === switchId) {
                                associatedItems.push({
                                    type:ASSOCIATED_TYPE_DEVICE,
                                    id:device.id,
                                    name:device.name
                                });
                            }
                    });
                }
            });
        }

        // Scenario part
        if (this.scenarioManager) {
            this.scenarioManager.getScenarios().forEach((scenario) => {
                if (scenario.RadioScenariosForm && scenario.RadioScenariosForm.radioScenariosForm) {
                    scenario.RadioScenariosForm.radioScenariosForm.forEach((scenarioRadio) => {
                        if (scenarioRadio.radio.module === module
                            && scenarioRadio.radio.protocol === protocol
                            && scenarioRadio.radio.deviceId === deviceId
                            && scenarioRadio.radio.switchId === switchId
                            && scenario.enabled
                            && ((parseFloat(scenarioRadio.status) === parseFloat(scenarioRadio.STATUS_ALL)) || (parseFloat(scenarioRadio.status) === parseFloat(status)))) {
                                associatedItems.push({
                                    type:ASSOCIATED_TYPE_SCENARIO,
                                    id:scenario.id,
                                    name:scenario.name
                                });
                            }
                    });

                }
            });
        }

        // Sensor part
        if (this.sensorsManager) {
            //console.log(this.sensorsManager.getSensorConfiguration());process.exit(0);
            this.sensorsManager.getSensorConfiguration().forEach((sensor) => {
                if (sensor.radio) {
                    sensor.radio.forEach((sensorRadio) => {
                        if (sensorRadio.module === module
                            && sensorRadio.protocol === protocol
                            && sensorRadio.deviceId === deviceId
                            && sensorRadio.switchId === switchId) {
                                associatedItems.push({
                                    type:ASSOCIATED_TYPE_SENSOR,
                                    id:sensor.id,
                                    name:sensor.name
                                });
                            }
                    });
                }
            });
        }

        return associatedItems;
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        const self = this;
        // Get form
        if (apiRequest.route === ROUTE_GET_BASE_PATH) {
            return new Promise((resolve) => {
                self.getLastReceivedRadioInformations((objects) => {
                    const data = [];

                    // Devices
                    objects.forEach((object) => {
                        data.push({
                            rawDate: object.timestamp,
                            date: DateUtils.class.dateFormatted(self.translateManager.t("datetime.format"), DateUtils.class.dateToTimestamp(object.timestamp)),
                            module: object.module,
                            protocol: object.protocol,
                            switchId: object.switchId,
                            deviceId: object.deviceId,
                            status: object.status,
                            value: object.value,
                            description: null,
                            associated:self.getAssociatedItems(object.module, object.protocol, object.switchId, object.deviceId, object.status)
                        });
                    });
                    resolve(new APIResponse.class(true, data));
                });
            });
        }
    }
}

module.exports = {class:RadioManager};
