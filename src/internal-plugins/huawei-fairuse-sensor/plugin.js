"use strict";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * OpenWeather humidity form sensor
     * @class
     */
    class HuaweiFairuseSensorForm extends api.exported.FairuseSensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {HuaweiFairuseSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(HuaweiFairuseSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class HuaweiFairuseSensor extends api.exported.FairuseSensor {
        /**
         * Open Weather Humidity sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {HuaweiFairuseSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            const self = this;
            api.getPluginInstance("huawei-router").register((data) => {
                if (data && data.dataUsage) {
                    // Convert bytes to Kb as base unit for fair use sensor
                    self.setValue((parseFloat(data.dataUsage.CurrentMonthDownload) + parseFloat(data.dataUsage.CurrentMonthUpload))/1024);
                }
            }, id);
        }
    }

    api.sensorAPI.registerClass(HuaweiFairuseSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "huawei-fairuse-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Huawei router fairuse sensor",
    dependencies:["fairuse-sensor", "huawei-router"]
};
