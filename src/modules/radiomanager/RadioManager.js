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

const ROUTE_GET_BASE_PATH = ":/radio/get/";
const RADIO_PLUGIN_KEY = "radio";

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
     * @returns {RadioManager}                The instance
     */
    constructor(pluginsManager, formManager, eventBus, scenarioManager, webServices, translateManager) {
        this.pluginsManager = pluginsManager;
        this.formManager = formManager;
        this.scenarioManager = scenarioManager;
        this.webServices = webServices;
        this.translateManager = translateManager;

        this.modules = [];
        this.protocols = [];

        const self = this;
        eventBus.on(PluginsManager.EVENT_LOADED, (pluginsManager) => {
            self.pluginsLoaded(pluginsManager, self);
        });

        this.webServices.registerAPI(this, WebServices.GET, ROUTE_GET_BASE_PATH, Authentication.AUTH_ADMIN_LEVEL);
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
        context.scenarioManager.register(RadioScenariosForm.class, null, "radio.scenario.form.trigger");
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
                            if (radioScenarioForm.radio.module === radioObject.module
                                && radioScenarioForm.radio.module === radioObject.module
                                && radioScenarioForm.radio.protocol === radioObject.protocol
                                && radioScenarioForm.radio.deviceId === radioObject.deviceId
                                && radioScenarioForm.radio.switchId === radioObject.switchId
                                && ((parseFloat(radioScenarioForm.status) === parseFloat(RadioScenarioForm.STATUS_ALL)) || (parseFloat(radioScenarioForm.status) === parseFloat(radioObject.status)))
                            ) {
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
                        self.protocols = self.protocols.concat(res);
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
                            description: null
                        });
                    });
                    resolve(new APIResponse.class(true, data));
                });
            });
        }
    }
}

module.exports = {class:RadioManager};
