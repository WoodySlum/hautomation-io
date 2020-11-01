"use strict";
const os = require("os");
const diskusage = require("diskusage");

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
    class RomUsageSensorForm extends api.exported.PercentSensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {RomUsageSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(RomUsageSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class RomUsageSensor extends api.exported.PercentSensor {
        /**
         * Huawei fairuse sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {RomUsageSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            this.icon = api.exported.Icons.icons["sd"];
            const path = os.platform() === "win32" ? "c:" : "/";
            api.timeEventAPI.register((self) => {
                diskusage.check(path, (err, info) => {
                    if (err) {
                        api.exported.Logger.err(err.message);
                    } else {
                        self.setValue(Math.round((info.total - info.free) / info.total * 100));
                    }
                });
            }, this, api.timeEventAPI.constants().EVERY_HOURS_INACCURATE);
        }
    }

    api.sensorAPI.registerClass(RomUsageSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "rom-usage-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Rom usage sensor",
    defaultDisabled: true,
    dependencies:["percent-sensor"]
};
