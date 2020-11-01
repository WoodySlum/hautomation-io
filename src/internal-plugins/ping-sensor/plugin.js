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
            // Credits : Freepik / https://www.flaticon.com/premium-icon/video-console_2970199
            const svg = "<svg id=\"Capa_1\" enable-background=\"new 0 0 512.008 512.008\" height=\"512\" viewBox=\"0 0 512.008 512.008\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><g><path d=\"m510.269 292.753c-6.976-37.703-16.491-76.969-29.087-120.041-12.518-42.777-50.93-72.543-95.58-74.069-85.996-2.962-173.202-2.962-259.194 0-44.652 1.526-83.064 31.292-95.583 74.071-12.596 43.071-22.11 82.337-29.086 120.041-10 54.053 24.093 106.516 77.613 119.435l1.871.45c8.172 1.975 16.415 2.95 24.592 2.95 19.386 0 38.406-5.484 55.24-16.152 22.228-14.085 37.886-35.462 44.563-60.63 15.136-1.782 27.832-11.644 33.636-25.149 5.571.009 11.157.015 16.75.015s11.179-.006 16.75-.015c5.804 13.509 18.504 23.372 33.645 25.15 6.806 25.684 22.895 47.333 45.78 61.392 1.224.752 2.58 1.11 3.918 1.11 2.521 0 4.982-1.27 6.398-3.575 2.168-3.529 1.064-8.148-2.465-10.316-18.708-11.493-32.087-28.922-38.312-49.617 18.124-4.637 31.562-21.104 31.562-40.653 0-23.136-18.822-41.958-41.958-41.958s-41.958 18.822-41.958 41.958c0 .508.02 1.011.038 1.514-8.92.011-17.877.011-26.796 0 .018-.503.038-1.006.038-1.514 0-23.136-18.822-41.958-41.958-41.958s-41.958 18.822-41.958 41.958c0 19.553 13.444 36.022 31.573 40.656-6.106 20.265-19.12 37.459-37.273 48.963-20.472 12.973-44.721 16.984-68.306 11.286l-1.847-.444c-45.775-11.05-74.935-55.908-66.385-102.125 6.883-37.199 16.282-75.98 28.733-118.558 10.696-36.552 43.528-61.987 81.7-63.291 5.302-.183 10.608-.354 15.919-.514.148 3.65.375 7.356.703 11.103 1.263 13.978 9.388 26.249 21.734 32.825 1.124.598 2.33.882 3.52.882 2.682 0 5.277-1.443 6.626-3.976 1.947-3.656.562-8.198-3.094-10.146-7.864-4.188-13.04-12.015-13.845-20.915-.301-3.438-.511-6.841-.65-10.193 65.269-1.703 131.066-1.703 196.337 0-.138 3.351-.348 6.75-.648 10.177-1.181 13.147-11.972 23.447-25.104 23.957-43.19 1.689-86.895 1.863-129.903.518-4.141-.155-7.601 3.122-7.731 7.262-.129 4.14 3.122 7.601 7.262 7.73 19.209.601 38.549.901 57.929.901 24.36 0 48.779-.475 73.027-1.423 20.643-.801 37.606-16.967 39.46-37.62.327-3.734.554-7.435.701-11.083 5.311.16 10.619.331 15.921.514 38.169 1.304 71.001 26.739 81.698 63.29 12.452 42.579 21.851 81.36 28.733 118.559 8.55 46.217-20.609 91.076-66.387 102.126l-1.87.45c-13.972 3.376-28.082 3.359-41.936-.053-4.02-.988-8.085 1.467-9.076 5.49-.99 4.022 1.468 8.085 5.49 9.076 16.211 3.991 32.712 4.014 49.045.067l1.868-.449c53.524-12.923 87.617-65.386 77.617-119.439zm-198.947-22.565c14.865 0 26.958 12.093 26.958 26.958s-12.094 26.958-26.958 26.958-26.958-12.094-26.958-26.958 12.093-26.958 26.958-26.958zm-137.595 26.958c0-14.865 12.094-26.958 26.958-26.958s26.958 12.093 26.958 26.958-12.094 26.958-26.958 26.958-26.958-12.093-26.958-26.958z\"/><path d=\"m141.36 194.37c-.477-.013-.953-.026-1.43-.038-.012-.477-.025-.954-.038-1.431-.445-16.397-13.614-29.249-29.985-29.256h-.442c-16.368.008-29.537 12.859-29.982 29.257-.013.477-.026.954-.038 1.43-.477.012-.953.025-1.43.038-16.397.444-29.249 13.614-29.256 29.985v.442c.008 16.368 12.859 29.538 29.257 29.982.476.013.953.026 1.429.038.012.477.025.954.038 1.43.445 16.397 13.614 29.248 29.985 29.256h.442c16.368-.008 29.537-12.858 29.982-29.256.013-.477.026-.953.038-1.43.477-.012.953-.025 1.43-.038 16.397-.444 29.249-13.614 29.256-29.985v-.442c-.008-16.368-12.859-29.537-29.256-29.982zm14.256 30.421c-.004 8.185-6.445 14.771-14.662 14.995-2.835.077-5.672.143-8.507.199-4.025.08-7.27 3.324-7.35 7.35-.056 2.835-.123 5.672-.199 8.507-.223 8.218-6.81 14.659-14.991 14.663h-.435c-8.185-.004-14.771-6.444-14.995-14.662-.077-2.836-.143-5.672-.199-8.508-.08-4.025-3.324-7.27-7.35-7.35-2.835-.056-5.672-.123-8.507-.199-8.218-.223-14.659-6.81-14.663-14.991v-.435c.004-8.185 6.445-14.771 14.662-14.995 2.835-.077 5.671-.143 8.506-.199 4.026-.079 7.271-3.324 7.351-7.35.056-2.836.123-5.673.199-8.508.223-8.218 6.81-14.659 14.991-14.663h.435c8.185.004 14.771 6.445 14.995 14.662.077 2.836.143 5.672.199 8.509.08 4.026 3.325 7.271 7.351 7.35 2.835.056 5.67.122 8.505.199 8.218.223 14.659 6.81 14.663 14.991v.435z\"/><path d=\"m421.688 230.9c7.731 0 15-3.01 20.466-8.477 5.467-5.466 8.477-12.735 8.477-20.465 0-7.731-3.01-15-8.477-20.466-5.466-5.467-12.735-8.478-20.466-8.478s-14.999 3.011-20.465 8.478c-5.467 5.466-8.478 12.735-8.478 20.466 0 7.73 3.011 14.999 8.478 20.465 5.466 5.466 12.734 8.477 20.465 8.477zm-9.859-38.802c2.633-2.633 6.135-4.084 9.859-4.084 3.725 0 7.226 1.451 9.859 4.084 5.436 5.437 5.436 14.282 0 19.718-2.634 2.633-6.135 4.083-9.859 4.083s-7.226-1.45-9.859-4.083c-5.436-5.436-5.436-14.282 0-19.718z\"/><path d=\"m355.987 226.727c-5.467 5.466-8.478 12.735-8.478 20.466 0 7.73 3.011 14.999 8.478 20.465 5.466 5.467 12.735 8.477 20.466 8.477 7.73 0 14.999-3.01 20.465-8.477 5.467-5.466 8.477-12.735 8.477-20.465 0-7.731-3.01-15-8.477-20.466-5.466-5.467-12.735-8.478-20.465-8.478-7.731 0-14.999 3.011-20.466 8.478zm30.325 30.324c-5.437 5.436-14.282 5.437-19.718 0s-5.436-14.282 0-19.718c2.718-2.718 6.289-4.077 9.859-4.077 3.571 0 7.141 1.359 9.859 4.077 5.436 5.437 5.436 14.282 0 19.718z\"/><path d=\"m234.986 189.403c-11.764 0-21.335 9.571-21.335 21.335s9.571 21.335 21.335 21.335h44.379c11.764 0 21.335-9.571 21.335-21.335s-9.571-21.335-21.335-21.335zm50.714 21.336c0 3.493-2.842 6.335-6.335 6.335h-44.379c-3.493 0-6.335-2.842-6.335-6.335s2.842-6.335 6.335-6.335h44.379c3.493-.001 6.335 2.842 6.335 6.335z\"/></g></svg>";
            super(api, id, "PING", configuration, svg, 0);
            this.unit = "ms";
            this.addClassifier(null, 10, 10);
            this.addClassifier(11, 30, 30);
            this.addClassifier(31, 50, 50);
            this.addClassifier(51, 80, 80);
            this.addClassifier(81, 100, 100);
            this.addClassifier(101, 300, 300);
            this.addClassifier(301, 800, 800);
            this.addClassifier(801, 1500, 1500);
            this.addClassifier(1501, null, 3000);
        }

        /**
         * Needs to be call when sensor is ready
         */
        init() {
            super.init();
            this.api.timeEventAPI.unregister({}, this.api.timeEventAPI.constants().EVERY_HOURS, null, null, null, BASE_KEY + this.id);
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
            }, this, this.api.timeEventAPI.constants().EVERY_HOURS_INACCURATE, null, null, null, BASE_KEY + this.id);
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
