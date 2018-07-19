"use strict";
const pathl = require("path");
const callsite = require("callsite");
const fs = require("fs-extra");

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();
    api.installerAPI.register(["x32", "x64"], "brew install python", false, true, true);
    api.installerAPI.register(["x32", "x64"], "pip install python-dateutil html", false, true, true);

    api.installerAPI.register(["arm", "arm64"], "apt-get install -y --allow-unauthenticated python3 python3-pip", true, true);
    api.installerAPI.register(["arm", "arm64"], "pip3 install python-dateutil html", true, true);


    /**
     * Linky form sensor
     * @class
     */
    class LinkySensorForm extends api.exported.ElectricSensorForm {

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
         * @param  {string} username The enedis username
         * @param  {string} password The enedis password
         * @returns {ElectricSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor, username, password) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor, username, password);

            /**
             * @Property("username");
             * @Title("enedis.username");
             * @Type("string");
             */
            this.username = username;

            /**
             * @Property("password");
             * @Title("enedis.password");
             * @Type("string");
             * @Display("password");
             */
            this.password = password;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {LinkySensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(LinkySensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class LinkySensor extends api.exported.ElectricSensor {
        /**
         * Sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {string} [type="UNKNOWN"]                                                 A plugin type
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @param  {string} [icon=null]                                                      An icon
         * @param  {number} [round=0]                                                        Round value (number of digits after comma)
         * @param  {string} [unit=null]                                                      Base unit
         * @param  {int} [aggregationMode=AGGREGATION_MODE_AVG]                           Aggregation mode
         * @param  {number} [dashboardGranularity=DEFAULT_DASHBOARD_AGGREGATION_GRANULARITY] Dashboard granularity in seconds. Default is one hour.
         * @param  {string} [chartType=CHART_TYPE_LINE]                                      Chart display type (bar or line)
         * @param  {Function} [cb=null] A callback with an error in parameter, called when database is initialized : `(err) => {}`
         * @returns {Sensor}                                                                  The instance
         */


        /**
         * Enedis Linky sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {LinkySensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration, null);
            this.aggregationMode = api.exported.Sensor.constants().AGGREGATION_MODE_SUM;
            this.chartType = api.exported.Sensor.constants().CHART_TYPE_BAR;
            const dir = api.exported.cachePath + "linky/";
            this.acceptTermOfUseAlertSent = false;

            try {
                fs.removeSync(dir);
                fs.ensureDirSync(dir);

                const linkyStartScript = fs.readFileSync(pathl.dirname(callsite()[0].getFileName()) + "/app/linky_start.py");
                const linkyScript = fs.readFileSync(pathl.dirname(callsite()[0].getFileName())+ "/app/linky.py");

                fs.writeFileSync(dir + "linky_start.py", linkyStartScript);
                fs.writeFileSync(dir + "linky.py", linkyScript);

                api.timeEventAPI.register((self) => {
                    if (configuration && configuration.username && configuration.password) {
                        self.api.installerAPI.executeCommand("python " + dir + "linky_start.py --username '" + configuration.username + "' --password '" + configuration.password + "'", false, (error, stdout) => {
                            if (error) {
                                self.api.exported.Logger.err(error.message);
                                if (!self.acceptTermOfUseAlertSent && error.message.indexOf("You need to accept the latest Terms of Use") > 0) {
                                    self.api.messageAPI.sendMessage("*", self.api.translateAPI.t("enedis.accept.term.of.use"));
                                    self.acceptTermOfUseAlertSent = true;
                                }
                            } else {
                                try {
                                    const data = JSON.parse(stdout);
                                    self.acceptTermOfUseAlertSent = false;
                                    if (data && data.graphe.data && data.graphe.periode.dateDebut) {
                                        const dateParts = data.graphe.periode.dateDebut.split("/");
                                        let timestamp = self.api.exported.DateUtils.class.dateToTimestamp(dateParts[2] + "-" + dateParts[1] + "-" + dateParts[0] +"T00:00:00");

                                        // Every 30 minutes, so aaggregate to hour
                                        let i = 0;
                                        let intermediateData = 0;
                                        data.graphe.data.forEach((data) => {
                                            intermediateData += data.valeur*1000;


                                            if (i%2 === 1) {
                                                if (intermediateData >= 0) {
                                                    self.setValue(intermediateData, 0, null, timestamp);
                                                }

                                                intermediateData = 0;
                                                timestamp += 3600;
                                            }

                                            i++;
                                        });
                                    }
                                } catch(e) {
                                    self.api.exported.Logger.err("Could not parse enedis data retrieved");
                                    self.api.exported.Logger.err(e.message);
                                    self.api.exported.Logger.err(stdout);
                                }

                            }
                        });
                    }

                }, this, api.timeEventAPI.constants().EVERY_HOURS);
            } catch(e) {
                api.exported.Logger.err(e.message);
            }
        }

        /**
         * Update tile and register to dashboard
         *
         * @param  {Function} [cb=null] A callback without parameters when done. Used for testing only.
         */
        updateTile(cb = null) {
            const midnightTimestamp = this.api.exported.DateUtils.class.roundedTimestamp(this.api.exported.DateUtils.class.timestamp(), this.api.exported.DateUtils.ROUND_TIMESTAMP_DAY);
            const previousMidnightTimestamp = (midnightTimestamp - (24 * 60 * 60));
            this.getStatistics(previousMidnightTimestamp, midnightTimestamp, (24 * 60 * 60), (err, results) => {
                if (!err && results.values && results.values[previousMidnightTimestamp] && results.unit) {
                    const tile = this.api.dashboardAPI.Tile("sensor-"+this.id, this.api.dashboardAPI.TileType().TILE_INFO_TWO_TEXT, this.icon, null, this.name, results.values[previousMidnightTimestamp] + " " + results.unit, null, null, null, 800, "statistics");
                    if (this.configuration.dashboardColor) {
                        tile.colors.colorDefault = this.configuration.dashboardColor;
                    }

                    if (this.configuration.dashboard) {
                        this.api.dashboardAPI.registerTile(tile);
                    } else {
                        this.api.dashboardAPI.unregisterTile("sensor-"+this.id);
                    }
                } else {
                    this.api.dashboardAPI.unregisterTile("sensor-"+this.id);
                }
                if (cb) cb();
            });
        }
    }

    api.sensorAPI.registerClass(LinkySensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "enedis-linky-electric-sensor",
    version: "0.0.1",
    category: "sensor",
    description: "Enedis Linky electric sensor",
    dependencies:["electric-sensor"]
};
