"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class should not be implemented but only inherited.
     * This class is used for sensors database
     * @class
     */
    class DbSensor extends api.exported.DbObject.class {
        /**
         * Radio table descriptor
         *
         * @param  {DbHelper} [dbHelper=null] A database helper
         * @param  {...Object} values          The values
         * @returns {DbObject}                 A database object
         */
        constructor(dbHelper = null, ...values) {
            super(dbHelper, ...values);

            /**
             * @Property("value");
             * @Type("number");
             * @Version("0.0.0");
             */
            this.value;

            /**
             * @Property("sensorId");
             * @Type("string");
             * @Version("0.0.0");
             */
            this.sensorId;

            /**
             * @Property("vcc");
             * @Type("double");
             * @Version("0.0.0");
             */
            this.vcc;
        }
    }

    /**
     * This class is extended by sensors forms
     * @class
     */
    class SensorForm extends api.exported.FormObject.class {
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
         * @returns {SensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor) {
            super(id);

            this.plugin = plugin;

            /**
             * @Property("name");
             * @Title("sensor.name");
             * @Type("string");
             * @Required(true);
             */
            this.name = name;

            /**
             * @Property("dashboard");
             * @Title("sensor.dashboard");
             * @Type("boolean");
             * @Default(true);
             */
            this.dashboard = dashboard;

            /**
             * @Property("statistics");
             * @Title("sensor.statistics");
             * @Type("boolean");
             * @Default(true);
             */
            this.statistics = statistics;

            /**
             * @Property("dashboardColor");
             * @Title("sensor.dashboard.color");
             * @Type("string");
             * @Display("color");
             */
            this.dashboardColor = dashboardColor;

            /**
             * @Property("statisticsColor");
             * @Title("sensor.statistics.color");
             * @Type("string");
             * @Display("color");
             */
            this.statisticsColor = statisticsColor;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {SensorForm}      An instance
         */
        json(data) {
            return new SensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(SensorForm);

    // Constants
    const AGGREGATION_MODE_AVG = 0;
    const AGGREGATION_MODE_SUM = 1;
    const AGGREGATION_MODE_MIN = 2;
    const AGGREGATION_MODE_MAX = 3;

    const GRANULARITY_MINUTE = 60;
    const GRANULARITY_HOUR = 60 * 60;
    const GRANULARITY_DAY = 24 * 60 * 60;
    const GRANULARITY_MONTH = 31 * 24 * 60 * 60;
    const GRANULARITY_YEAR = 360 * 31 * 24 * 60 * 60;

    const DEFAULT_DASHBOARD_AGGREGATION_GRANULARITY = GRANULARITY_HOUR;
    const MAX_STATISTICS_COUNT = 10000;

    const CHART_TYPE_LINE = "line";
    const CHART_TYPE_BAR = "bar";

    /**
     * This class is extended by sensors
     * @class
     */
    class Sensor {
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
        constructor(api, id = null, type = "UNKNOWN", configuration = null, icon = null, round = 0, unit = null, aggregationMode = AGGREGATION_MODE_AVG, dashboardGranularity = DEFAULT_DASHBOARD_AGGREGATION_GRANULARITY, chartType = CHART_TYPE_LINE, cb = null) {
            this.api = api;
            this.api.databaseAPI.register(DbSensor, cb);
            this.dbHelper = this.api.databaseAPI.dbHelper(DbSensor);
            this.icon = icon;
            this.id = id;
            this.configuration = configuration;
            this.aggregationMode = aggregationMode;
            this.dashboardGranularity = dashboardGranularity;
            this.chartType = chartType;
            this.type = type;

            if (!this.id || !this.configuration || !this.type) {
                throw Error("Sensor does not have configuration or identifier or type !");
            }
            this.unitConverter = null;
            this.unit = unit;
            this.unitAggregation = {};
            this.round = round;

            this.name = this.configuration.name;
        }

        /**
         * Access to constants
         *
         * @returns {Object} A list of constants
         */
        static constants() {
            return {AGGREGATION_MODE_AVG:AGGREGATION_MODE_AVG, AGGREGATION_MODE_SUM:AGGREGATION_MODE_SUM, AGGREGATION_MODE_MIN:AGGREGATION_MODE_MIN, AGGREGATION_MODE_MAX:AGGREGATION_MODE_MAX,
                GRANULARITY_MINUTE:GRANULARITY_MINUTE, GRANULARITY_HOUR:GRANULARITY_HOUR, GRANULARITY_DAY:GRANULARITY_DAY, GRANULARITY_MONTH:GRANULARITY_MONTH, GRANULARITY_YEAR:GRANULARITY_YEAR,
                CHART_TYPE_LINE:CHART_TYPE_LINE, CHART_TYPE_BAR:CHART_TYPE_BAR};
        }

        /**
         * Needs to be call when sensor is ready
         */
        init() {
            // Check for unit
            if (!this.unit) {
                throw Error("No unit set for sensor " + this.name + " (#" + this.id + ")");
            }

            // Update tile
            this.updateTile();
        }

        /**
         * Add a unit aggregation
         *
         * @param {string} unitName              The unit's name
         * @param {number} [lowThreshold=0] A low limit threshold. From this limit the unitName will be used
         */
        addUnitAggregation(unitName, lowThreshold = 0) {
            this.unitAggregation[lowThreshold] = unitName;
        }

        /**
         * Aggregate a unit depending on threshold
         *
         * @param  {number} value            A value to convert
         * @param  {string} [forceUnit=null] If set, this will force conversion to the specified value. Otherwise will use adapted value
         * @returns {Object}                  An object with transformed value and unit
         */
        aggregateUnit(value, forceUnit = null) {
            let thresholdsKeys = Object.keys(this.unitAggregation);
            // Sort ascending threshold
            thresholdsKeys = thresholdsKeys.sort((threshold1, threshold2) => {
                return parseFloat(threshold1) - parseFloat(threshold2);
            });

            let unit = this.unit;
            let aggregatedValue = value;

            thresholdsKeys.forEach((thresholdKey) => {
                const threshold = parseFloat(thresholdKey);
                if (value >= threshold || (forceUnit && (forceUnit === this.unitAggregation[thresholdKey]))) {
                    unit = this.unitAggregation[thresholdKey];
                    aggregatedValue = value / threshold;
                }
            });

            return {value:aggregatedValue, unit:unit};
        }

        /**
         * Convert a value depending unit, unit converter and aggregation engine
         *
         * @param  {number} value A value
         * @param  {string} [forceUnit=null] Force unit conversion
         * @returns {Object}       An object with two properties (value, unit)
         */
        convertValue(value, forceUnit = null) {
            // Convert to float
            value = parseFloat(value);

            // Convert unit
            if (this.unitConverter) {
                value = this.unitConverter(value);
            }

            // Aggregation unit
            const aggregated = this.aggregateUnit(value, forceUnit);

            // Round
            value = aggregated.value.toFixed(this.round);

            return {value:parseFloat(value), unit:aggregated.unit};
        }

        /**
         * Retrieve last object from database.
         * If duration is passed, the aggregation will be done base on parameters and duration.
         *
         * @param  {Function} cb              A callback e.g. `(err, res) => {}`
         * @param  {number}   [duration=null] A duration in seconds. If null or not provided, will provide last inserted database value.
         */
        lastObject(cb, duration = null) {
            let operator = null;
            switch(this.aggregationMode) {
            case AGGREGATION_MODE_AVG:
                operator = this.dbHelper.Operators().AVG;
                break;
            case AGGREGATION_MODE_SUM:
                operator = this.dbHelper.Operators().SUM;
                break;
            case AGGREGATION_MODE_MAX:
                operator = this.dbHelper.Operators().MAX;
                break;
            case AGGREGATION_MODE_MIN:
                operator = this.dbHelper.Operators().MIN;
                break;
            }

            let lastObjectRequest;
            if (duration) {
                lastObjectRequest = this.dbHelper.RequestBuilder()
                                                        .selectOp(operator, "value")
                                                        .selectOp(this.dbHelper.Operators().MIN, "vcc")
                                                        .where("sensorId", this.dbHelper.Operators().EQ, this.id)
                                                        .where(this.dbHelper.Operators().FIELD_TIMESTAMP, this.dbHelper.Operators().GTE, (this.api.exported.DateUtils.class.timestamp() - duration))
                                                        .where(this.dbHelper.Operators().FIELD_TIMESTAMP, this.dbHelper.Operators().LTE, this.api.exported.DateUtils.class.timestamp())
                                                        .order(this.dbHelper.Operators().DESC, this.dbHelper.Operators().FIELD_TIMESTAMP)
                                                        .first();
            } else {
                lastObjectRequest = this.dbHelper.RequestBuilder()
                                                        .select()
                                                        .where("sensorId", this.dbHelper.Operators().EQ, this.id)
                                                        .order(this.dbHelper.Operators().DESC, this.dbHelper.Operators().FIELD_TIMESTAMP)
                                                        .first();
            }

            this.dbHelper.getObjects(lastObjectRequest, (err, res) => {
                if (!err && res.length === 1) {
                    const lastObject = res[0];
                    cb(null, lastObject);
                } else {
                    if (err) {
                        cb(err, null);
                    } else {
                        cb(Error("No results"), null);
                    }
                }
            });
        }

        /**
         * Update tile and register to dashboard
         *
         * @param  {Function} [cb=null] A callback without parameters when done. Used for testing only.
         */
        updateTile(cb = null) {
            this.lastObject((err, lastObject) => {
                if (!err && lastObject.value) {
                    const convertedValue = this.convertValue(lastObject.value);
                    const tile = this.api.dashboardAPI.Tile("sensor-"+this.id, this.api.dashboardAPI.TileType().TILE_INFO_TWO_TEXT, this.icon, null, this.name, convertedValue.value + " " + convertedValue.unit, null, null, null, 800, "statistics");
                    if (this.configuration.dashboardColor) {
                        tile.colors.colorDefault = this.configuration.dashboardColor;
                    }

                    if (this.configuration.dashboard) {
                        this.api.dashboardAPI.registerTile(tile);
                    } else {
                        this.api.dashboardAPI.unregisterTile("sensor-"+this.id);
                    }
                    if (cb) cb();
                } else {
                    this.api.dashboardAPI.unregisterTile("sensor-"+this.id);
                    if (cb) cb();
                }
            }, this.dashboardGranularity);
        }

        /**
         * Set a value and store in database
         *
         * @param {number} value      A value
         * @param {number} [vcc=null] A voltage level
         * @param  {Function} [cb=null] A callback with an error parameter, called when done. Used for testing only.
         * @param {number} [timestamp=null] A timestamp
         */
        setValue(value, vcc = null, cb = null, timestamp = null) {
            const currentObject = new DbSensor(this.dbHelper, value, this.id, vcc);
            this.api.exported.Logger.info("New value received for sensor " + this.name + "(#" + this.id + "). Value : " + value + ", vcc : " + vcc);

            // If timestamp provided
            if (timestamp) {
                const existing = {};
                existing[this.dbHelper.Operators().FIELD_TIMESTAMP] = timestamp;
                const timestampRequest = this.dbHelper.RequestBuilder()
                                          .select()
                                          .where("CAST(strftime('%s', timestamp) AS NUMERIC)", this.dbHelper.Operators().EQ, timestamp)
                                          .where("sensorId", this.dbHelper.Operators().EQ, this.id)
                                          .first();
                this.dbHelper.getObjects(timestampRequest, (error, objects) => {
                    if (objects && objects.length == 1) {
                        const object = objects[0];
                        object.value = value;

                        object.save();
                        this.updateTile();
                    } else {
                        if (!error) {
                            const currentObject = new DbSensor(this.dbHelper, value, this.id, vcc);
                            currentObject.timestamp = timestamp;

                            currentObject.save((err) => {
                                process.exit(0);
                                if (!err) {
                                    this.updateTile();
                                }
                                if (cb) cb(err);
                            });
                        } else {
                            if (cb) cb(error);
                        }
                    }
                });
            } else {
                // If timestamp not provided
                currentObject.save((err) => {
                    if (!err) {
                        this.updateTile();
                    }
                    if (cb) cb(err);
                });

                // Dispatch
                const aggregated = this.convertValue(value);
                this.api.sensorAPI.onNewSensorValue(this.id, this.type, value, this.unit, vcc, aggregated.value, aggregated.unit);
            }

        }

        /**
         * Round a timestamp to a lower value
         *
         * @param  {number} ts          A timestamp
         * @param  {number} granularity An aggregation unit in seconds. Can be sensor's constants.
         * @returns {number}             A rounded timestamp to aggregation unit
         */
        roundTimestamp(ts, granularity) {
            return ts - (ts % granularity);
        }

        /**
         * Get sensor's statistics
         *
         * @param  {number}   timestampBegin Begin period
         * @param  {number}   timestampEnd   End period
         * @param  {number}   granularity    Granularity, for aggregation. Can be number in seconds, or granularity constants
         * @param  {Function} cb             A callback e.g. `(err, results) => {}`
         * @param  {Function} [roundTimestampFunction=null]  A  e.g. `(timestamp) => {return  timestamp;}`
         * @param {string}    [roundDateSqlFormat=null] In relation with roundTimeStampFunction, the SQL date format. E.g. : "%Y-%m-01 00:00:00"
         */
        getStatistics(timestampBegin, timestampEnd, granularity, cb, roundTimestampFunction = null, roundDateSqlFormat = null) {
            let aggregationMode = AGGREGATION_MODE_AVG;
            switch(this.aggregationMode) {
            case AGGREGATION_MODE_AVG:
                aggregationMode = this.dbHelper.Operators().AVG;
                break;
            case AGGREGATION_MODE_SUM:
                aggregationMode = this.dbHelper.Operators().SUM;
                break;
            case AGGREGATION_MODE_MIN:
                aggregationMode = this.dbHelper.Operators().MIN;
                break;
            case AGGREGATION_MODE_MAX:
                aggregationMode = this.dbHelper.Operators().MAX;
                break;
            }

            // Prepare results
            let results = {};
            let i = timestampBegin;
            let j = 0;
            while (i <= timestampEnd && j < MAX_STATISTICS_COUNT) {
                if (roundTimestampFunction) {
                    i = roundTimestampFunction(i);
                    results[i] = null;
                } else {
                    results[this.roundTimestamp(i, granularity)] = null;
                }

                i += granularity;
                j++;
            }

            if (j >= MAX_STATISTICS_COUNT) {
                this.api.exported.Logger.err("Max statistics cycle reach for sensor #" + this.id + ". Memory protection enabled");
                if (cb) {
                    cb(Error("Memory protection enabled"));
                }
            }

            const statisticsRequest = this.dbHelper.RequestBuilder()
                                      .select(roundDateSqlFormat?"CAST(strftime('%s', strftime('" + roundDateSqlFormat + "', date(timestamp, 'utc'))) AS NUMERIC) as aggTimestamp":"CAST(strftime('%s',  timestamp)  AS NUMERIC) - (CAST(strftime('%s',  timestamp)  AS NUMERIC) % " + granularity + ") as aggTimestamp")
                                      .selectOp(aggregationMode, "value")
                                      .where("CAST(strftime('%s', timestamp) AS NUMERIC)", this.dbHelper.Operators().GTE, timestampBegin)
                                      .where("CAST(strftime('%s', timestamp) AS NUMERIC)", this.dbHelper.Operators().LTE, timestampEnd)
                                      .where("sensorId", this.dbHelper.Operators().EQ, this.id)
                                      .group("aggTimestamp")
                                      .order(this.dbHelper.Operators().ASC, "aggTimestamp");

            const self = this;
            this.dbHelper.getObjects(statisticsRequest, (error, objects) => {
                if (!error) {
                    // Affect results to statistics

                    // Store max number in this loop for unit aggregation :)
                    let max = null;
                    objects.forEach((statisticObject) => {
                        // Set value to array
                        if (results.hasOwnProperty(statisticObject.aggTimestamp.toString())) {
                            results[statisticObject.aggTimestamp.toString()] = statisticObject.value;
                        }

                        // Save max value
                        if (!max || statisticObject.value > max) {
                            max = statisticObject.value;
                        }
                    });

                    // Ok, now, convert data to max value :)
                    let unit = self.unit;
                    if (max) {
                        unit = self.aggregateUnit(max).unit;
                    }

                    // Now got everything to convert values referenced to max and configuration !
                    // Let's go
                    Object.keys(results).forEach((timestamp) => {
                        if (results[timestamp] != null) {
                            results[timestamp] = parseFloat(self.convertValue(results[timestamp], unit).value);
                        }
                    });

                    if (cb) {
                        cb(null, {values:results, unit:unit});
                    }
                } else {
                    if (cb) {
                        cb(error);
                    }
                }
            });
        }

        /**
         * Returns the linked iot identifier
         *
         * @returns {number} Iot identifier
         */
        getIotIdentifier() {
            let identifier = null;
            if (this.configuration.IotsListForm && this.configuration.IotsListForm.identifier) {
                identifier = parseInt(this.configuration.IotsListForm.identifier);
            }

            return identifier;
        }
    }

    api.sensorAPI.registerClass(DbSensor);
    api.sensorAPI.registerClass(Sensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Sensor base plugin"
};
