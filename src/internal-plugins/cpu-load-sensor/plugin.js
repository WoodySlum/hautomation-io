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
     * CPU load form sensor
     * @class
     */
    class CpuLoadSensorForm extends api.exported.PercentSensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {CpuLoadSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(CpuLoadSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class CpuLoadSensor extends api.exported.PercentSensor {
        /**
         * Huawei fairuse sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {CpuLoadSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            this.icon = api.exported.Icons.class.list()["microchip"];
            api.timeEventAPI.register((self, hour, minute) => {
                if (minute % 15 === 0) {
                    self.setValue(Math.round((os.loadavg(15) / os.cpuCount()) * 100));
                }
            }, this, api.timeEventAPI.constants().EVERY_MINUTES);
        }
    }

    api.sensorAPI.registerClass(CpuLoadSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "cpu-load-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Cpu load sensor",
    defaultDisabled: true,
    dependencies:["percent-sensor"]
};
