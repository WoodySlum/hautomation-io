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
    class TlMr6400FairuseSensorForm extends api.exported.FairuseSensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {TlMr6400FairuseSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(TlMr6400FairuseSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class TlMr6400FairuseSensor extends api.exported.FairuseSensor {
        /**
         * Open Weather Humidity sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {TlMr6400FairuseSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            const self = this;
            api.getPluginInstance("tplink-tl-mr6400").register((data) => {
                self.setValue(parseFloat(data.wan.totalStatistics)/1024);
            }, id);
        }
    }

    api.sensorAPI.registerClass(TlMr6400FairuseSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "tl-mr6400-fairuse-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "TP-Link TL-MR6400 fairuse sensor",
    defaultDisabled: true,
    dependencies:["fairuse-sensor", "tplink-tl-mr6400"]
};
