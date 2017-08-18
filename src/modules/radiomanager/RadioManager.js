/* eslint-disable */
"use strict";
const Logger = require("./../../logger/Logger");
const RadioForm = require("./RadioForm");
const RadioScenarioForm = require("./RadioScenarioForm");
const PluginsManager = require("./../pluginsmanager/PluginsManager");

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
     * @returns {RadioManager}                The instance
     */
    constructor(pluginsManager, formManager, eventBus, scenarioManager) {
        this.pluginsManager = pluginsManager;
        this.formManager = formManager;
        this.scenarioManager = scenarioManager;

        this.modules = [];
        this.protocols = [];

        const self = this;
        eventBus.on(PluginsManager.EVENT_LOADED, (pluginsManager) => {
            self.pluginsLoaded(pluginsManager, self);
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
        context.scenarioManager.register(RadioScenarioForm.class, null, "radio.scenario.form.trigger");
    }

    /**
     * Register for radio events
     */
    registerRadioEvents() {
        const self = this;
        this.pluginsManager.getPluginsByCategory("radio").forEach((plugin) => {
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
        this.pluginsManager.getPluginsByCategory("radio").forEach((plugin) => {
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
            if (scenario.RadioScenarioForm.radio) {
                if (scenario.RadioScenarioForm.radio.module === radioObject.module
                    && scenario.RadioScenarioForm.radio.module === radioObject.module
                    && scenario.RadioScenarioForm.radio.protocol === radioObject.protocol
                    && scenario.RadioScenarioForm.radio.deviceId === radioObject.deviceId
                    && scenario.RadioScenarioForm.radio.switchId === radioObject.switchId
                    && ((parseFloat(scenario.RadioScenarioForm.status) === parseFloat(RadioScenarioForm.STATUS_ALL)) || (parseFloat(scenario.RadioScenarioForm.status) === parseFloat(radioObject.status)))
                ) {
                    this.scenarioManager.triggerScenario(scenario);
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
        this.pluginsManager.getPluginsByCategory("radio").forEach((plugin) => {
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
        this.pluginsManager.getPluginsByCategory("radio").forEach((plugin) => {
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
}

module.exports = {class:RadioManager};
