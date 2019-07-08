"use strict";

const IFTTT = require("node-ifttt-maker");

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
          * @returns {IftttScenarioForm}              The instance
          */
        constructor(id, iftttEvent) {
            super(id);

             /**
              * @Property("iftttEvent");
              * @Type("string");
              * @Title("ifttt.scenario.event");
              */
            this.iftttEvent = iftttEvent;
        }

         /**
          * Convert json data
          *
          * @param  {Object} data Some key / value data
          * @returns {IftttForm}      A form object
          */
        json(data) {
            return new IftttScenarioForm(data.id, data.iftttEvent);
        }
    }

    api.configurationAPI.register(IftttForm);

    /**
     * This class manage huawei routers
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
