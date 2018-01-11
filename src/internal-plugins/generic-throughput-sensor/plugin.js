"use strict";
const request = require("request");

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * Generic throughput form sensor
     * @class
     */
    class GenericThroughputSensorForm extends api.exported.ThroughputSensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {GenericThroughputSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(GenericThroughputSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class GenericThroughputSensor extends api.exported.ThroughputSensor {
        /**
         * Generic throughput sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {GenericThroughputSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            this.api.timeEventAPI.register((self) => {
                // const dlFile = "http://test-debit.free.fr/2048.rnd";
                let contentLength = 0;
                const dlFile = "http://test-debit.free.fr/512.rnd";
                const start = Date.now();
                request({ method: "GET", url: dlFile, gzip: false, timeout:3000})
                .on("error", (err) => {
                    self.api.exported.Logger.err("Throughput download failed. Error : ");
                    self.api.exported.Logger.err(err.message);
                    self.setValue(0);
                })
                .on("timeout", () => {
                    self.api.exported.Logger.warn("Throughput timeout");
                    self.setValue(0);
                })
                .on("data", (chunk) => {
                    contentLength += chunk.length;
                })
                .on("end", () => {
                    const end = Date.now();
                    const elapsed = (end - start) / 1000;
                    const kb = contentLength / 1024;
                    const throughput = Math.floor((kb / elapsed) | 0);
                    self.api.exported.Logger.info("Throughput sensor downloaded " + kb + " bytes in " + elapsed + " seconds. Throughput : " + throughput + " kb/s");
                    self.setValue(throughput);
                });
            }, this, this.api.timeEventAPI.constants().EVERY_HOURS);
        }
    }

    api.sensorAPI.registerClass(GenericThroughputSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "generic-throughput-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Internet quality of experience",
    dependencies:["throughput-sensor"]
};
