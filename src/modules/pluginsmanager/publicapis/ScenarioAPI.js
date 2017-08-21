"use strict";
const PrivateProperties = require("./../PrivateProperties");

/**
 * Public API for scenarios
 * @class
 */
class ScenarioAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {ScenarioManager} scenarioManager The scenario manager
    //  * @returns {ScenarioAPI}             The instance
    //  */
    constructor(scenarioManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).scenarioManager = scenarioManager;
    }
    /* eslint-enable */

    /**
     * Register to scenario execution engine
     *
     * @param  {FormObject} formPart         A form part
     * @param  {Function} [triggerCb=null] A trigger called when a scenario should be executed. E.g. : `(scenario) => {}`
     * @param  {string} [title=null]     The title for sub form (can be translation key)
     */
    register(formPart, triggerCb = null, title = null) {
        PrivateProperties.oprivate(this).scenarioManager.register(formPart, triggerCb, title);
    }

    /**
     * Unregister to scenario execution engine
     *
     * @param  {FormObject} formPart         A form part
     * @param  {Function} [triggerCb=null] A trigger called when a scenario should be executed. E.g. : `(scenario) => {}`
     */
    unregister(formPart, triggerCb = null) {
        PrivateProperties.oprivate(this).scenarioManager.unregister(formPart, triggerCb);
    }

    /**
     * Called when a scenario is triggered
     *
     * @param  {ScenarioForm} scenario A scenario
     */
    triggerScenario(scenario) {
        PrivateProperties.oprivate(this).scenarioManager.triggerScenario(scenario);
    }

    /**
     * Return a COPY of the scenarios array
     *
     * @returns {[ScenarioForm]} An array of Scenario
     */
    getScenarios() {
        return PrivateProperties.oprivate(this).scenarioManager.getScenarios();
    }
}

module.exports = {class:ScenarioAPI};
