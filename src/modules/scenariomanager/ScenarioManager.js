"use strict";
const Logger = require("./../../logger/Logger");
const ScenariosListForm = require("./ScenariosListForm");
const ScenarioSubActionForm = require("./ScenarioSubActionForm");
const ScenarioTriggerAfterForm = require("./ScenarioTriggerAfterForm");
const FormConfiguration = require("./../formconfiguration/FormConfiguration");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");
const ScenarioUrlTriggerForm = require("./ScenarioUrlTriggerForm");
const ScenarioForm = require("./ScenarioForm");
const TimeScenarioForm = require("./TimeScenarioForm");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");
const DateUtils = require("./../../utils/DateUtils");
const sha256 = require("sha256");
const CONF_KEY = "scenarios";
const SUB_ACTION_SCHEDULER_KEY = "sub-action";
const ACTION_SCHEDULER_KEY = "action";
const DELAY_IMMEDIATELY = "immediately";
const DELAY_DAYS = "days";
const DELAY_HOURS = "hours";
const DELAY_MINUTES = "minutes";
const TRIGGER_URL_WEBSERVICE_KEY = "scenario/trigger";
const ROUTE_TRIGGER_URL_BASE_PATH = ":/" + TRIGGER_URL_WEBSERVICE_KEY + "/";
const ROUTE_RIGGER_URL_FULL_PATH = ROUTE_TRIGGER_URL_BASE_PATH + "[key]/[username*]/";
const ERROR_CODE_URL_TRIGGER = 400;


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
     * @param  {SchedulerService} schedulerService  The scheduler service
     * @returns {ScenarioManager} The instance
     */
    constructor(confManager, formManager, webServices, timeEventService, schedulerService) {
        this.confManager = confManager;
        this.formManager = formManager;
        this.webServices = webServices;
        this.timeEventService = timeEventService;
        this.schedulerService = schedulerService;
        this.formConfiguration = new FormConfiguration.class(confManager, formManager, webServices, CONF_KEY, true, ScenarioForm.class);
        this.formManager.register(TimeScenarioForm.class);
        this.registerScenariosListForm();
        this.formManager.register(ScenarioSubActionForm.class);
        this.gatewayManager = null; // There is a dependency ons cenario manager on gateway. Check setGatewayManager method
        // Register to form configuration callback
        this.formConfiguration.setUpdateCb(() => {
            this.registerScenariosListForm();
        });

        this.registered = {};
        // Time event
        this.timeEventService.register((self) => {
            self.timeEventScenario(self);
        }, this, TimeEventService.EVERY_MINUTES);

        // Sub actions
        const self = this;
        this.schedulerService.register(SUB_ACTION_SCHEDULER_KEY, (data) => {
            self.getScenarios().forEach((scenario) => {
                if (scenario.id === data.scenarioId) {
                    self.triggerScenario(scenario);
                }
            });
        });

        this.schedulerService.register(ACTION_SCHEDULER_KEY, (data) => {
            self.getScenarios().forEach((scenario) => {
                if (scenario.id === data.scenarioId) {
                    self.triggerScenario(scenario, true);
                }
            });
        });

        this.formConfiguration.setSortFunction((a,b) => a.name.localeCompare(b.name));

        this.webServices.registerAPI(this, "*", ROUTE_RIGGER_URL_FULL_PATH, Authentication.AUTH_NO_LEVEL);
    }

    /**
     * Set the gateway manager, due to cross includes
     *
     * @param {GatewayManager} gatewayManager The gateway manager instance
     */
    setGatewayManager(gatewayManager) {
        if (!this.gatewayManager) {
            this.gatewayManager = gatewayManager;
            this.registerWithInjection(ScenarioUrlTriggerForm.class, null, "scenario.form.url.trigger.title", 200, false, this.gatewayManager.getDistantApiUrl(), TRIGGER_URL_WEBSERVICE_KEY);
        }
    }

    /**
     * Register a scenario list form
     */
    registerScenariosListForm() {
        const scenariosName = [];
        const scenariosId = [];
        this.formConfiguration.data.sort((a,b) => a.name.localeCompare(b.name)).forEach((scenario) => {
            scenariosName.push(scenario.name);
            scenariosId.push(scenario.id);
        });
        this.formManager.register(ScenarioTriggerAfterForm.class);
        this.formManager.register(ScenariosListForm.class, scenariosName, scenariosId);
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
     * @param  {number} [sort=null]      Sort
     * @param {boolean} isList `false` if this is a list of objects, otherwise `false`
     */
    register(formPart, triggerCb = null, title = null, sort = null, isList = false) {
        this.registerWithInjection(formPart, triggerCb, title, sort, isList);
    }

    /**
     * Register to scenario execution engine with injection
     *
     * @param  {FormObject} formPart         A form part
     * @param  {Function} [triggerCb=null] A trigger called when a scenario should be executed. E.g. : `(scenario) => {}`
     * @param  {string} [title=null]     The title for sub form
     * @param  {number} [sort=null]      Sort
     * @param {boolean} isList `false` if this is a list of objects, otherwise `false`
     * @param  {...Object} inject Parameters injection on static methods
     */
    registerWithInjection(formPart, triggerCb = null, title = null, sort = null, isList = false, ...inject) {
        this.unregister(formPart, triggerCb);
        this.registered[this.generateKey(formPart, triggerCb)] = {formPart:formPart, triggerCb:triggerCb};
        if (formPart) {
            this.formConfiguration.addAdditionalFieldsWithSort(formPart, title, sort, isList, ...inject);
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
     * @param  {boolean} [isScheduled=false] Flag to detect if action should be executed immediately or scheduled
     * @param  {Object}  [additionalInfos={}] Additional informations
     */
    triggerScenario(scenario, isScheduled = false, additionalInfos = {}) {
        const self = this;
        if (scenario.enabled) {
            if (isScheduled || !scenario.delay || !scenario.delay.unit || (scenario.delay && scenario.delay.unit && scenario.delay.unit === DELAY_IMMEDIATELY)) {
                Logger.info("Trigger scenario " + scenario.id);
                Object.keys(self.registered).forEach((registeredScenarioKey) => {
                    const registeredScenario = this.registered[registeredScenarioKey];
                    if (registeredScenario.triggerCb) {
                        registeredScenario.triggerCb(scenario, additionalInfos);
                    }
                });

                // Plan sub actions
                if (scenario.subActions && scenario.subActions.length > 0) {
                    scenario.subActions.forEach((subAction) => {
                        let delay = parseInt(subAction.delay);
                        const nextTriggerTimestamp = delay * 60 + DateUtils.class.timestamp();
                        Logger.info("Scheduling sub scenario " + subAction.scenario.scenario + " at " + nextTriggerTimestamp);
                        self.schedulerService.schedule(SUB_ACTION_SCHEDULER_KEY, nextTriggerTimestamp , {scenarioId:subAction.scenario.scenario});
                    });

                }
            } else {
                // Plan action
                const delay = scenario.delay.delay ? parseInt(scenario.delay.delay) : 0;
                let delta = 0;
                if (scenario.delay.unit === DELAY_DAYS) {
                    delta += 60 * 60 * 24 * delay;
                } else if (scenario.delay.unit === DELAY_HOURS) {
                    delta += 60 * 60 * delay;
                } else if (scenario.delay.unit === DELAY_MINUTES) {
                    delta += 60 * delay;
                }
                const nextTriggerTimestamp = delta + DateUtils.class.timestamp();
                Logger.info("Scheduling scenario " + scenario.id + " at " + nextTriggerTimestamp);
                self.schedulerService.schedule(ACTION_SCHEDULER_KEY, nextTriggerTimestamp , {scenarioId:scenario.id});

            }

        }
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

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        if (apiRequest.route.startsWith(ROUTE_TRIGGER_URL_BASE_PATH)) {
            return new Promise((resolve, reject) => {
                const webServiceKey = apiRequest.data.key;
                let scenarioDetected = null;
                this.getScenarios().forEach((scenario) => {
                    if (webServiceKey && scenario.ScenarioUrlTriggerForm && scenario.ScenarioUrlTriggerForm.triggerUrl && scenario.ScenarioUrlTriggerForm.triggerUrl.indexOf(webServiceKey) > 0) {
                        scenarioDetected = scenario;
                    }
                });

                if (scenarioDetected) {
                    let enabled = false;
                    if (scenarioDetected.ScenarioUrlTriggerForm && scenarioDetected.ScenarioUrlTriggerForm.status) {
                        if (scenarioDetected.ScenarioUrlTriggerForm.status === "on") {
                            enabled = true;
                        }
                    }
                    if (enabled) {
                        this.triggerScenario(scenarioDetected, false, ((apiRequest.authenticationData && apiRequest.authenticationData.username) ? {username: apiRequest.authenticationData.username} : ((apiRequest.data && apiRequest.data.username) ? {username:apiRequest.data.username} : {})));
                        resolve(new APIResponse.class(true, {success: true}));
                    } else {
                        reject(new APIResponse.class(false, {}, ERROR_CODE_URL_TRIGGER, "Trigger disabled"));
                    }
                } else {
                    Logger.err("Could not find a scenario to trigger for key " + webServiceKey);
                    reject(new APIResponse.class(false, {}, ERROR_CODE_URL_TRIGGER, "Invalid key"));
                }


            });
        }
    }
}

module.exports = {class:ScenarioManager};
