"use strict";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * Radio presence form sensor
     * @class
     */
    class RadioSmokeSensorForm extends api.exported.SmokeSensorForm {
        /**
         * Radio presence sensor form
         *
         * @param  {number} id              An identifier
         * @param  {string} plugin          A plugin
         * @param  {string} name            Sensor's name
         * @param  {boolean} dashboard       True if display on dashboard, otherwise false
         * @param  {boolean} statistics      True if display on statistics, otherwise false
         * @param  {string} dashboardColor  The dashboard color
         * @param  {string} statisticsColor The statistics color
         * @param  {Array} radio The radio objects
         * @returns {RadioSmokeSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor, radio) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);

            /**
             * @Property("radio");
             * @Type("objects");
             * @Cl("RadioForm");
             * @Title("device.form.radio");
             * @Default([]);
             */
            this.radio = radio;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {RadioSmokeSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(RadioSmokeSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class RadioSmokeSensor extends api.exported.SmokeSensor {
        /**
         * Radio smoke sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {RadioSmokeSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            api.exported.Radio.registerSensor(api, this, () => {
                api.messageAPI.sendMessage("*", api.translateAPI.t("radio.smoke.sensor.message", configuration.name), null, null, null, true);
            });
        }
    }

    api.sensorAPI.registerClass(RadioSmokeSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "radio-smoke-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Radio smoke sensor",
    dependencies:["smoke-sensor"]
};
