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
         * Sensor form
         *
         * @param  {number} id              An identifier
         * @param  {string} plugin          A plugin
         * @param  {string} name            Sensor's name
         * @param  {boolean} dashboard       True if display on dashboard, otherwise false
         * @param  {boolean} statistics      True if display on statistics, otherwise false
         * @param  {string} dashboardColor  The dashboard color
         * @param  {string} statisticsColor The statistics color
         * @returns {GenericThroughputSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor, file, failOnTimeout) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);

            /**
             * @Property("file");
             * @Type("string");
             * @Title("generic.throughput.size");
             * @Required(true);
             * @Enum(["512", "1024", "2048", "4096", "8192", "16384", "32768", "65536"]);
             * @EnumNames(["generic.throughput.size.512", "generic.throughput.size.1024", "generic.throughput.size.2048", "generic.throughput.size.4096", "generic.throughput.size.8192", "generic.throughput.size.16384", "generic.throughput.size.32768", "generic.throughput.size.65536"]);
             */
            this.file = file;

            /**
             * @Property("doNotFailOnTimeout");
             * @Type("boolean");
             * @Title("generic.throughput.doNotFailOnTimeout");
             */
            this.doNotFailOnTimeout = doNotFailOnTimeout;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {GenericThroughputSensorForm}      An instance
         */
        json(data) {
            return new GenericThroughputSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor, data.file, data.doNotFailOnTimeout);
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
            const self = this;
            this.api.timeEventAPI.register((self) => {
                if (self.configuration.file) {
                    const dlFile = "http://test-debit.free.fr/" + self.configuration.file + ".rnd";
                    const timeout = 15 * 1000;
                    let contentLength = 0;

                    const start = Date.now();
                    let finished = false;
                    let error = false;
                    let r = request({ method: "GET", url: dlFile, gzip: false, timeout:timeout})
                    .on("error", (err) => {
                        error = true;
                        self.api.exported.Logger.err("Throughput download failed. Error : ");
                        self.api.exported.Logger.err(err.message);
                        self.setValue(0);
                    })
                    .on("timeout", () => {
                        error = true;
                        self.api.exported.Logger.warn("Throughput timeout");
                        self.setValue(0);
                    })
                    .on("data", (chunk) => {
                        contentLength += chunk.length;
                    })
                    .on("end", () => {
                        if (!error || self.configuration.doNotFailOnTimeout) {
                            const end = Date.now();
                            const elapsed = (end - start) / 1000;
                            const kb = contentLength / 1024;
                            const throughput = Math.floor((kb / elapsed) | 0);
                            self.api.exported.Logger.info("Throughput sensor downloaded " + kb + " bytes in " + elapsed + " seconds. Throughput : " + throughput + " kb/s");
                            self.setValue(throughput);
                            finished = true;
                        }
                    });

                    setTimeout(() => {
                        if (!finished && !self.configuration.doNotFailOnTimeout) {
                            const end = Date.now();
                            const elapsed = (end - start) / 1000;
                            self.api.exported.Logger.info("Throughput test timeout : " + elapsed + " seconds duration");
                            error = true;
                            r.abort();
                            self.setValue(0);
                        }
                    }, timeout);
                } else {
                    self.api.exported.Logger.warn("No file size set in configuration");
                }

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
