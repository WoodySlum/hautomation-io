"use strict";
const Logger = require("./../../logger/Logger");
const FormConfiguration = require("./../formconfiguration/FormConfiguration");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");
const ScenarioForm = require("./ScenarioForm");
const TimeScenarioForm = require("./TimeScenarioForm");
const sha256 = require("sha256");
const CONF_KEY = "scenarios";

/**
 * This class allows to manage scenarios
 * @class
 */
class ScenarioManager {
    /**
     * Constructor
     *
     * @param  {ConfManager} confManager A configuration manager needed for persistence
     * @param  {FormManager} formManager  A form manager
     * @param  {WebServices} webServices  The web services
     * @param  {TimeEventService} timeEventService  The time event service
     * @returns {ScenarioManager} The instance
     */
    constructor(confManager, formManager, webServices, timeEventService) {
        this.confManager = confManager;
        this.formManager = formManager;
        this.webServices = webServices;
        this.timeEventService = timeEventService;
        this.formConfiguration = new FormConfiguration.class(confManager, formManager, webServices, CONF_KEY, true, ScenarioForm.class);
        this.formManager.register(TimeScenarioForm.class);
        this.registered = {};
        // Time event
        this.timeEventService.register((self) => {
            self.timeEventScenario(self);
        }, this, TimeEventService.EVERY_MINUTES);
    }

    /**
     * Generate a registration key
     *
     * @param  {FormObject} formPart         A form part
     * @param  {Function} [triggerCb=null] A trigger called when a scenario should be executed. E.g. : `(scenario) => {}`
     * @returns {string}                  A generated key
     */
    generateKey(formPart, triggerCb = null) {
        let baseKey = "";
        if (formPart) baseKey += formPart.toString();
        if (triggerCb) baseKey += triggerCb.toString();
        return sha256(baseKey);
    }

    /**
     * Register to scenario execution engine
     *
     * @param  {FormObject} formPart         A form part
     * @param  {Function} [triggerCb=null] A trigger called when a scenario should be executed. E.g. : `(scenario) => {}`
     * @param  {string} [title=null]     The title for sub form
     */
    register(formPart, triggerCb = null, title = null) {
        this.registered[this.generateKey(formPart, triggerCb)] = {formPart:formPart, triggerCb:triggerCb};
        if (formPart) {
            this.formConfiguration.addAdditionalFields(formPart, title);
        }
    }

    /**
     * Unregister to scenario execution engine
     *
     * @param  {FormObject} formPart         A form part
     * @param  {Function} [triggerCb=null] A trigger called when a scenario should be executed. E.g. : `(scenario) => {}`
     */
    unregister(formPart, triggerCb = null) {
        delete this.registered[this.generateKey(formPart, triggerCb)];
    }

    /**
     * Called when a scenario is triggered
     *
     * @param  {ScenarioForm} scenario A scenario
     */
    triggerScenario(scenario) {
        Logger.info("Trigger scenario " + scenario.id);
        Object.keys(this.registered).forEach((registeredScenarioKey) => {
            const registeredScenario = this.registered[registeredScenarioKey];
            if (registeredScenario.triggerCb) {
                registeredScenario.triggerCb(scenario);
            }
        });
    }

    /**
     * Return a COPY of the scenarios array
     *
     * @returns {[ScenarioForm]} An array of Scenario
     */
    getScenarios() {
        return this.formConfiguration.getDataCopy();
    }

    /**
     * Time event scenario, called every minutes
     *
     * @param  {ScenarioManager} context The instance (self, this, ...)
     */
    timeEventScenario(context) {
        const date = new Date();
        const day = parseInt(date.getDay());
        const hour = parseInt(date.getHours());
        const minute = parseInt(date.getMinutes());

        context.getScenarios().forEach((scenario) => {
            if (scenario.timeTrigger && scenario.timeTrigger.length > 0) {
                let shouldExecute = false;

                scenario.timeTrigger.forEach((timeTrigger) => {
                    const expectedDay = parseInt(timeTrigger.day);
                    const expectedHour = parseInt(timeTrigger.time.split(":")[0]);
                    const expectedMinute = parseInt(timeTrigger.time.split(":")[1]);

                    if (day === expectedDay
                        && hour === expectedHour
                        && minute === expectedMinute) {
                        shouldExecute = true;
                    }
                });

                if (shouldExecute) {
                    context.triggerScenario(scenario);
                }
            }
        });
    }
}

module.exports = {class:ScenarioManager};
