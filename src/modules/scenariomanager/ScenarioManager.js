"use strict";
const Logger = require("./../../logger/Logger");
const ScenariosListForm = require("./ScenariosListForm");
const ScenarioSubActionForm = require("./ScenarioSubActionForm");
const ScenarioLockForm = require("./ScenarioLockForm");
const ScenarioTriggerAfterForm = require("./ScenarioTriggerAfterForm");
const FormConfiguration = require("./../formconfiguration/FormConfiguration");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");
const ScenarioUrlTriggerForm = require("./ScenarioUrlTriggerForm");
const ScenarioUrlCallForm = require("./ScenarioUrlCallForm");
const ScenarioForm = require("./ScenarioForm");
const TimeScenarioForm = require("./TimeScenarioForm");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");
const DateUtils = require("./../../utils/DateUtils");
const sha256 = require("sha256");
const request = require("request");
const CONF_KEY = "scenarios";
const SUB_ACTION_SCHEDULER_KEY = "sub-action";
const ACTION_SCHEDULER_KEY = "action";
const DELAY_IMMEDIATELY = "immediately";
const DELAY_SECONDS = "seconds";
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
        this.registeredScenarioChanges = [];
        this.scenarioLocks = {};

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
        this.formConfiguration.setUpdateCb((data) => {
            this.registerScenariosListForm();
            this.registeredScenarioChanges.forEach((cb) => {
                cb(data);
            });
        });

        this.webServices.registerAPI(this, "*", ROUTE_RIGGER_URL_FULL_PATH, Authentication.AUTH_NO_LEVEL);

        // Disable this for unit test
        if (!process.env.TEST) {
            this.register(ScenarioUrlCallForm.class, (scenario, additionalInfos) => {
                if (scenario.ScenarioUrlCallForm && scenario.ScenarioUrlCallForm.length > 0) {
                    scenario.ScenarioUrlCallForm.forEach((scenarioUrlCallForm) => {
                        if (scenarioUrlCallForm.url.length > 0) {
                            if (scenarioUrlCallForm.method === "GET") {
                                request({url:scenarioUrlCallForm.url, method: "GET"})
                                    .on("response", (response) => {
                                        Logger.info("Call to " + scenarioUrlCallForm.url + " with a status code of " + response.statusCode);
                                    })
                                    .on("error", (err) => {
                                        Logger.err("Error while calling GET " + scenarioUrlCallForm.url + " : " + err.message);
                                    });

                            } else if (scenarioUrlCallForm.method === "POST") {
                                request({url:scenarioUrlCallForm.url, method: "POST", json: additionalInfos})
                                    .on("response", (response) => {
                                        Logger.info("Call to " + scenarioUrlCallForm.url + " with a status code of " + response.statusCode);
                                    })
                                    .on("error", (err) => {
                                        Logger.err("Error while calling POST " + scenarioUrlCallForm.url + " : " + err.message);
                                    });
                            }
                        }
                    });
                }

            }, "scenario.form.url.call.title", null, true);
        }
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

            // Update URLs form
            const configuration = this.formConfiguration.getConfig();
            configuration.forEach((configuration) => {
                if (configuration && configuration.ScenarioUrlTriggerForm && configuration.ScenarioUrlTriggerForm.triggerUrl && configuration.ScenarioUrlTriggerForm.triggerUrl.length > 0) {
                    let urlSplit = configuration.ScenarioUrlTriggerForm.triggerUrl.split("/");
                    if (urlSplit.length > 1 && configuration.ScenarioUrlTriggerForm.triggerUrl.indexOf("undefined") === -1) {
                        configuration.ScenarioUrlTriggerForm.triggerUrl = this.gatewayManager.getDistantApiUrl() + ((urlSplit[urlSplit.length - 1].length > 0) ? urlSplit[urlSplit.length - 1] : urlSplit[urlSplit.length - 2]) + "/";
                    } else {
                        // Fix an issue in Gateway Manager where already generated URLs was 'undefined' instead of /API/
                        // This is a dirt quick fix to help keeping old corrupted URLs
                        urlSplit = configuration.ScenarioUrlTriggerForm.triggerUrl.split("undefined");
                        if (urlSplit.length > 0) {
                            configuration.ScenarioUrlTriggerForm.triggerUrl = this.gatewayManager.getDistantApiUrl() + TRIGGER_URL_WEBSERVICE_KEY + "/" + urlSplit[urlSplit.length - 1];
                        }
                    }
                }
            });
            this.formConfiguration.save();
        }
    }

    /**
     * Register a scenario list form
     */
    registerScenariosListForm() {
        const scenariosName = [];
        const scenariosId = [];
        if (this.formConfiguration.data.length > 0) {
            this.formConfiguration.data.sort((a,b) => a.name.localeCompare(b.name)).forEach((scenario) => {
                scenariosName.push(scenario.name);
                scenariosId.push(scenario.id);
            });
            this.formManager.register(ScenarioLockForm.class);
            this.formManager.register(ScenarioTriggerAfterForm.class);
            this.formManager.register(ScenariosListForm.class, scenariosName, scenariosId);
        }
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
     * @param  {Function} [triggerCb=null] A trigger called when a scenario should be executed. E.g. : `(scenario, additionalInfos) => {}`
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
     * @param  {Function} [triggerCb=null] A trigger called when a scenario should be executed. E.g. : `(scenario, additionalInfos) => {}`
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
     * Check and apply scenario lock if necessary

     * @param  {ScenarioLockForm} scenarioLockForm         A scenario lock form part
     * @param  {string} scenarioId         A scenario identifier
     *
     * @returns {boolean} `true` if the scenario can be executed, `false` otherwise
     */
    lockScenario(scenarioLockForm, scenarioId) {
        let shouldRun = true;
        if (scenarioLockForm && scenarioLockForm.enabled) {
            // Check for lock
            const newTimer = DateUtils.class.timestamp() + (60 * parseInt(scenarioLockForm.timer ? scenarioLockForm.timer : 0));
            if (this.scenarioLocks[scenarioId]) {
                if (DateUtils.class.timestamp() > this.scenarioLocks[scenarioId]) {
                    this.scenarioLocks[scenarioId] = newTimer;
                } else {
                    Logger.info("Scenario " + scenarioId + " is locked until " + this.scenarioLocks[scenarioId] + ". Could not execute.");
                    shouldRun = false;
                }
            } else {
                this.scenarioLocks[scenarioId] = newTimer;
            }
        }

        return shouldRun;
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
        if (scenario.enabled && this.lockScenario(scenario.lock, scenario.id)) {
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
                        let delay = parseFloat(String(subAction.delay).replace(",", "."));
                        const nextTriggerTimestamp = delay * 60 + DateUtils.class.timestamp();
                        Logger.info("Scheduling sub scenario " + subAction.scenario.scenario + " at " + nextTriggerTimestamp);
                        if (delay < 1) {
                            setTimeout(() => {
                                self.getScenarios().forEach((scenario) => {
                                    if (scenario.id === subAction.scenario.scenario) {
                                        self.triggerScenario(scenario);
                                    }
                                });
                            }, parseInt(delay * 60) * 1000);
                        } else {
                            self.schedulerService.schedule(SUB_ACTION_SCHEDULER_KEY, nextTriggerTimestamp , {scenarioId:subAction.scenario.scenario});
                        }
                    });

                }
            } else {
                // Plan action
                const delay = scenario.delay.delay ? parseFloat(String(scenario.delay.delay).replace(",", ".")) : 0;
                let delta = 0;
                if (scenario.delay.unit === DELAY_SECONDS) {
                    setTimeout(() => {
                        self.getScenarios().forEach((scenar) => {
                            if (scenar.id === scenario.id) {
                                self.triggerScenario(scenar, true);
                            }
                        });
                    }, delay * 1000);
                } else {
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

    /**
     * Register for scenario change (scenario creation, modify, delete)
     *
     * @param  {Function} cb A callback `(data) => {}`
     */
    registerForScenarioChanges(cb) {
        if (cb) {
            this.registeredScenarioChanges.push(cb);
        }
    }

}

module.exports = {class:ScenarioManager};
