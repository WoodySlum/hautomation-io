"use strict";
const os = require("os-utils");

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * Huawei fairuse form sensor
     * @class
     */
    class RamUsageSensorForm extends api.exported.PercentSensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {RamUsageSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(RamUsageSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class RamUsageSensor extends api.exported.PercentSensor {
        /**
         * Huawei fairuse sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {RamUsageSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            this.icon = api.exported.Icons.class.list()["microchip"];
            api.timeEventAPI.register((self) => {
                self.setValue(Math.round(os.freememPercentage() * 100));
            }, this, api.timeEventAPI.constants().EVERY_HOURS_INACCURATE);
        }
    }

    api.sensorAPI.registerClass(RamUsageSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "ram-usage-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Ram usage sensor",
    defaultDisabled: true,
    dependencies:["percent-sensor"]
};
