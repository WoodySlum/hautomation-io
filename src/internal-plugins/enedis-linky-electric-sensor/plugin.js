"use strict";
const linky = require("@bokub/linky");

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();


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

            api.timeEventAPI.register((self) => {
                self.updateData(self);
            }, this, api.timeEventAPI.constants().EVERY_HOURS);

            this.updateData();
        }

        /**
         * Retrieve data and store into database
         *
         * @param  {LinkySensor} context A context
         */
        updateData(context) {
            if (!context) {
                context = this;
            }

            const configuration = context.configuration;
            if (configuration && configuration.username && configuration.password) {
                try {
                    if (configuration && configuration.username && configuration.password) {
                        linky.login(configuration.username, configuration.password).then((session) => {
                            session.getHourlyData({
                                user:configuration.username,
                                password:configuration.password
                            })
                                .then((data) => {
                                    if (data && data.length > 0 && data[0] && data[0].date) {
                                        context.api.exported.Logger.info("Updating Linky data");
                                        // Every 30 minutes, so aaggregate to hour
                                        let i = 0;
                                        let intermediateData = 0;
                                        let timestamp = this.api.exported.DateUtils.class.dateToTimestamp(data[0].date) - 3600;
                                        data.forEach((data) => {
                                            intermediateData += data.value*1000;

                                            if (i%2 === 1) {
                                                if (intermediateData >= 0) {
                                                    context.setValue(intermediateData, 0, null, timestamp);
                                                }

                                                intermediateData = 0;
                                                timestamp += 3600;
                                            }

                                            i++;
                                        });
                                    }
                                })
                                .catch((e) => {
                                    context.api.exported.Logger.err(e.message);
                                });
                        })
                            .catch((e) => {
                                context.api.exported.Logger.err(e.message);
                            });
                    }
                } catch(e) {
                    context.api.exported.Logger.err(e.message);
                }
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
                    const tile = this.api.dashboardAPI.Tile("sensor-" + this.id, this.api.dashboardAPI.TileType().TILE_INFO_TWO_TEXT, this.icon, null, this.name, results.values[previousMidnightTimestamp] + " " + results.unit, null, null, null, 800, "statistics");
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
