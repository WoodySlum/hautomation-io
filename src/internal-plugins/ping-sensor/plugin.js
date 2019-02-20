"use strict";
const ping = require ("net-ping");
const dns = require("dns");
const DEFAULT_DOMAIN = "www.google.fr";
const BASE_KEY = "ping-sensor-";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by fairuse sensors
     * @class
     */
    class PingSensorForm extends api.exported.SensorForm {
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
         * @param  {string} domain The domain
         * @returns {PingSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor, domain) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);

            /**
             * @Property("domain");
             * @Type("string");
             * @Default("www.google.fr");
             * @Title("sensor.ping.domain");
             */
            this.domain = domain;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {PingSensorForm}      An instance
         */
        json(data) {
            return new PingSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor, data.domain);
        }
    }

    api.sensorAPI.registerForm(PingSensorForm);

    /**
     * This class manages network ping sensor
     * @class
     */
    class PingSensor extends api.exported.Sensor {
        /**
         * Fairuse sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {PingSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, "PING", configuration, api.exported.Icons.class.list()["gamepad"], 0);
            this.unit = "ms";
        }

        /**
         * Needs to be call when sensor is ready
         */
        init() {
            super.init();
            this.api.timeEventAPI.unregister({}, this.api.timeEventAPI.constants().EVERY_MINUTES, null, null, null, BASE_KEY + this.id);
            this.api.timeEventAPI.register((self) => {
                const domain = (self.configuration.domain && this.configuration.domain.length > 0) ? self.configuration.domain : DEFAULT_DOMAIN;
                dns.lookup(domain, (err, ip) => {
                    if (!err && ip) {
                        const session = ping.createSession();
                        session.pingHost(ip, (error, target, sent, rcvd) => {
                            const ms = rcvd - sent;
                            if (error) {
                                self.api.exported.Logger.err(error.message);
                            } else {
                                self.setValue(ms);
                            }
                        });
                    } else {
                        self.api.exported.Logger.err(err.message);
                    }
                });
            }, this, this.api.timeEventAPI.constants().EVERY_MINUTES, null, null, null, BASE_KEY + this.id);
        }
    }

    api.sensorAPI.registerClass(PingSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "ping-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Network ping sensor",
    dependencies:["sensor"]
};
