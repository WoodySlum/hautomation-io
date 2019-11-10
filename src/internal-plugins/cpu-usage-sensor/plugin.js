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
    class CpuUsageSensorForm extends api.exported.PercentSensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {CpuUsageSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(CpuUsageSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class CpuUsageSensor extends api.exported.PercentSensor {
        /**
         * Huawei fairuse sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {CpuUsageSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            this.icon = api.exported.Icons.class.list()["microchip"];
            api.timeEventAPI.register((self) => {
                self.setValue(Math.round(os.freememPercentage() * 100));
            }, this, api.timeEventAPI.constants().EVERY_MINUTES);
        }
    }

    api.sensorAPI.registerClass(CpuUsageSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "cpu-usage-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Cpu usage sensor",
    defaultDisabled: true,
    dependencies:["percent-sensor"]
};
