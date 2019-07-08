"use strict";

const IFTTT = require("node-ifttt-maker");
const WEBSERVICE_KEY = "ifttt/get";
const ROUTE_GET_BASE_PATH = ":/" + WEBSERVICE_KEY + "/";
const ROUTE_GET_FULL_PATH = ROUTE_GET_BASE_PATH + "[key]/";
const ERROR_CODE_IFTT_TRIGGER = 400;

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

   /**
    * This class is used for IFTTT form
    * @class
    */
    class IftttForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id           Identifier
         * @param  {string} makerKey       The maker key
         * @returns {IftttForm}              The instance
         */
        constructor(id, makerKey) {
            super(id);

            /**
             * @Property("makerKey");
             * @Type("string");
             * @Title("ifttt.maker.key");
             */
            this.makerKey = makerKey;
        }

        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {IftttForm}      A form object
         */
        json(data) {
            return new IftttForm(data.id, data.makerKey);
        }
    }
    /**
     * This class is used for IFTTT scenario form
     * @class
     */
    class IftttScenarioForm extends api.exported.FormObject.class {
         /**
          * Constructor
          *
          * @param  {number} id           Identifier
          * @param  {string} iftttEvent       The ifttt event
          * @param  {string} iftttTriggerUrlToken       The ifttt trigger url token
          * @param  {string} iftttTriggerUrl       The ifttt trigger url
          * @returns {IftttScenarioForm}              The instance
          */
        constructor(id, iftttEvent, iftttTriggerUrlToken, iftttTriggerUrl) {
            super(id);

             /**
              * @Property("iftttEvent");
              * @Type("string");
              * @Title("ifttt.scenario.event");
              */
            this.iftttEvent = iftttEvent;

            /**
             * @Property("iftttTriggerUrlToken");
             * @Type("string");
             * @Hidden(true);
             * @Sort(200);
             */
            this.iftttTriggerUrlToken = iftttTriggerUrlToken;

            /**
             * @Property("iftttTriggerUrl");
             * @Type("string");
             * @Readonly(true);
             * @Title("ifttt.trigger.url");
             * @Value("getIftttUrl");
             * @Sort(200);
             */
            this.iftttTriggerUrl = iftttTriggerUrl;
        }

        /**
         * Returns the IFTT url fot the scenario
         *
         * @returns {string} A complete URL
         */
        static getIftttUrl() {
            if (!this.iftttTriggerUrlToken) {
                let randomStr = "";
                const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                const charactersLength = characters.length;
                for (var i = 0 ; i < 15 ; i++) {
                    randomStr += characters.charAt(Math.floor(Math.random() * charactersLength));
                }

                this.iftttTriggerUrlToken = randomStr;
            }
            return api.gatewayAPI.getDistantApiUrl() + WEBSERVICE_KEY + "/" + this.iftttTriggerUrlToken + "/";
        }


         /**
          * Convert json data
          *
          * @param  {Object} data Some key / value data
          * @returns {IftttForm}      A form object
          */
        json(data) {
            return new IftttScenarioForm(data.id, data.iftttEvent, data.iftttTriggerUrlToken, data.iftttTriggerUrl);
        }
    }

    api.configurationAPI.register(IftttForm);

    /**
     * This class manage Ifttt extension
     * @class
     */
    class Ifttt {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The api
         * @returns {Ifttt}     The instance
         */
        constructor(api) {
            this.api = api;

            this.api.webAPI.register(this, this.api.webAPI.constants().GET, ROUTE_GET_FULL_PATH, this.api.webAPI.Authentication().AUTH_NO_LEVEL);

            this.api.scenarioAPI.register(IftttScenarioForm, (scenario) => {
                if (scenario.IftttScenarioForm && scenario.IftttScenarioForm.iftttEvent && scenario.IftttScenarioForm.iftttEvent.length > 0) {
                    if (api.configurationAPI.getConfiguration() && api.configurationAPI.getConfiguration().makerKey) {
                        const ifttt = new IFTTT(api.configurationAPI.getConfiguration().makerKey);

                        const event = scenario.IftttScenarioForm.iftttEvent;

                        ifttt
                        .request(event)
                        .then((response) => {
                            api.exported.Logger.info("Event " + scenario.IftttScenarioForm.iftttEvent + " sent to IFTTT");
                            api.exported.Logger.verbose(response);
                        })
                        .catch((err) => {
                            api.exported.Logger.err(err.message);
                        });
                    } else {
                        api.exported.Logger.err("No maker key configured. Could not send event to IFTTT");
                    }
                }
            }, this.api.translateAPI.t("ifttt.scenario.title"));
        }

        /**
         * Process API callback
         *
         * @param  {APIRequest} apiRequest An APIRequest
         * @returns {Promise}  A promise with an APIResponse object
         */
        processAPI(apiRequest) {
            const self = this;
            if (apiRequest.route.startsWith(ROUTE_GET_BASE_PATH)) {
                return new Promise((resolve, reject) => {
                    const ifttWebServiceKey = apiRequest.data.key;
                    let scenarioDetected = null;
                    self.api.scenarioAPI.getScenarios().forEach((scenario) => {
                        if (ifttWebServiceKey && scenario.IftttScenarioForm && scenario.IftttScenarioForm.iftttTriggerUrl && scenario.IftttScenarioForm.iftttTriggerUrl.indexOf(ifttWebServiceKey) > 0) {
                            scenarioDetected = scenario;
                        }
                    });
                    if (scenarioDetected) {
                        self.api.scenarioAPI.triggerScenario(scenarioDetected);
                        resolve(self.api.webAPI.APIResponse(true, {success: true}));
                    } else {
                        self.api.exported.Logger.err("Could not find an IFTTT scenario to trigger for key " + ifttWebServiceKey);
                        reject(self.api.webAPI.APIResponse(false, {}, ERROR_CODE_IFTT_TRIGGER, "Invalid key"));
                    }


                });
            }
        }
    }

    //api.exportClass(HuaweiRouter);
    api.registerInstance(new Ifttt(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "ifttt",
    version: "0.0.0",
    category: "misc",
    description: "IFTTT plugin"
};
