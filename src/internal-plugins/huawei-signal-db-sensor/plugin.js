"use strict";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * Huawei signal db form sensor
     * @class
     */
    class HuaweiSignalDbSensorForm extends api.exported.SignalDbSensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {HuaweiSignalDbSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(HuaweiSignalDbSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class HuaweiSignalDbSensor extends api.exported.SignalDbSensor {
        /**
         * Huawei signal db sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {HuaweiSignalDbSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            const self = this;
            api.getPluginInstance("huawei-router").register((data) => {
                if (data && data.signal && data.signal.rssi && data.signal.rssi.length > 0) {
                    const rssi = parseInt(data.signal.rssi[0].replace("dBm", ""));
                    self.setValue(rssi);
                }
            }, id);
        }
    }

    api.sensorAPI.registerClass(HuaweiSignalDbSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "huawei-signal-db-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Huawei router signal db sensor",
    dependencies:["signal-db-sensor", "huawei-router"]
};
