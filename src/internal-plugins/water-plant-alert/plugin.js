"use strict";

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
    class WaterPlantAlertForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id           Identifier
         * @param  {number} threshold       The threshold

         * @returns {WaterPlantAlertForm}              The instance
         */
        constructor(id, threshold) {
            super(id);

            /**
             * @Property("threshold");
             * @Type("number");
             * @Default(20);
             * @Title("water.plant.alert.threshold");
             * @Range([1, 100, 5]);
             */
            this.threshold = threshold;
        }

        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {WaterPlantAlertForm}      A form object
         */
        json(data) {
            return new WaterPlantAlertForm(data.id, data.threshold);
        }
    }

    api.configurationAPI.register(WaterPlantAlertForm);


    /**
     * This class manage water plant alert extension
     * @class
     */
    class WaterPlantAlert {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The api
         * @returns {WaterPlantAlert}     The instance
         */
        constructor(api) {
            this.api = api;
            this.sent = {};
            this.api.sensorAPI.registerSensorEvent((id, type, value) => {
                const data = this.api.configurationAPI.getConfiguration();
                if (data) {
                    const threshold = data.threshold;

                    if (!this.sent[id] && value <= threshold) {
                        this.sent[id] = true;
                        const name = this.api.sensorAPI.getSensor(id).name;
                        this.api.messageAPI.sendMessage("*", this.api.translateAPI.t("water.plant.alert.message", name));
                    }

                    if (value > threshold) {
                        delete this.sent[id];
                    }
                }
            }, "*", "PLANT-SENSOR");
        }
    }

    api.registerInstance(new WaterPlantAlert(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "water-plant-alert",
    version: "0.0.0",
    category: "misc",
    defaultDisabled: true,
    description: "Alert when you need to water plants"
};
