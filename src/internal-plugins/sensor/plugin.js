"use strict";

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

    class SensorForm extends api.exported.FormObject.class {
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

    const DEFAULT_DASHBOARD_AGGREGATION_GRANULARITY = 3600;

    /**
     * This class is overloaded by sensors
     * @class
     */
    class Sensor {
        constructor(api, id = null, configuration = null, icon = null, round = 0, unit = null, aggregationMode = AGGREGATION_MODE_AVG, dashboardGranularity = DEFAULT_DASHBOARD_AGGREGATION_GRANULARITY) {
            this.api = api;
            this.api.databaseAPI.register(DbSensor);
            this.dbHelper = this.api.databaseAPI.dbHelper(DbSensor);
            this.icon = icon;
            this.id = id;
            this.configuration = configuration;
            this.aggregationMode = aggregationMode;
            this.dashboardGranularity = dashboardGranularity;

            if (!this.id && !this.configuration) {
                throw Error("Sensor does not have configuration or identifier !");
            }
            this.unitConverter = null;
            this.unit = unit;
            this.unitAggregation = {};
            this.round = round;
        }

        static constants() {
            return {AGGREGATION_MODE_AVG:AGGREGATION_MODE_AVG, AGGREGATION_MODE_SUM:AGGREGATION_MODE_SUM, AGGREGATION_MODE_MIN:AGGREGATION_MODE_MIN, AGGREGATION_MODE_MAX:AGGREGATION_MODE_MAX};
        }

        /**
         * Needs to be call when sensor is ready
         */
        init() {
            // Check for unit
            if (!this.unit) {
                throw Error("No unit set for sensor " + this.configuration.name + " (#" + this.id + ")");
            }

            // Update tile
            this.updateTile();
        }

        /**
         * Add a unit aggregation
         *
         * @param {String} unitName              The unit's name
         * @param {Number} [lowThreshold=0] A low limit threshold. From this limit the unitName will be used
         */
        addUnitAggregation(unitName, lowThreshold = 0) {
            this.unitAggregation[lowThreshold] = unitName;
        }

        aggregateUnit(value) {
            let thresholdsKeys = Object.keys(this.unitAggregation);
            // Sort ascending threshold
            thresholdsKeys = thresholdsKeys.sort((threshold1, threshold2) => {
              return parseFloat(threshold1) - parseFloat(threshold2);
            });

            let unit = this.unit;
            let aggregatedValue = value;
            thresholdsKeys.forEach((thresholdKey) => {
                const threshold = parseFloat(thresholdKey);
                if (value >= threshold) {
                    unit = this.unitAggregation[thresholdKey];
                    aggregatedValue = value / threshold;
                }
            });

            return {value:aggregatedValue, unit:unit};
        }


        /**
         *Convert a value depending unit, unit converter and aggregation engine
         *
         * @param  {number} value A value
         * @returns {Object}       An object with two properties (value, unit)
         */
        convertValue(value) {
            // Convert to float
            value = parseFloat(value);

            // Convert unit
            if (this.unitConverter) {
                value = this.unitConverter(value);
            }

            // Aggregation unit
            const aggregated = this.aggregateUnit(value);

            // Round
            value = aggregated.value.toFixed(this.round);

            return {value:value, unit:aggregated.unit};
        }

        /**
         * Retrieve last object from database.
         * If duration is passed, the aggregation will be done base on parameters and duration.
         *
         * @param  {Function} cb              A callback e.g. `(err, res) => {}`
         * @param  {Number}   [duration=null] A duration in seconds. If null or not provided, will provide last inserted database value.
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
                                                        .selectOp(this.dbHelper.Operators().MIN, "vcc")
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
         */
        updateTile() {
            this.lastObject((err, lastObject) => {
                if (!err && lastObject.value) {
                    const convertedValue = this.convertValue(lastObject.value);
                    const tile = this.api.dashboardAPI.Tile("sensor-"+this.id, this.api.dashboardAPI.TileType().TILE_INFO_TWO_TEXT, this.icon, null, this.configuration.name, convertedValue.value + convertedValue.unit);
                    if (this.configuration.dashboardColor) {
                        tile.colors.colorDefault = this.configuration.dashboardColor;
                    }
                    this.api.dashboardAPI.registerTile(tile);
                } else {
                    this.api.dashboardAPI.unregisterTile("sensor-"+this.id);
                }
            }, this.dashboardGranularity);
        }

        /**
         * Set a value and store in database
         *
         * @param {number} value      A value
         * @param {number} [vcc=null] A voltage level
         */
        setValue(value, vcc = null) {
            const currentObject = new DbSensor(this.dbHelper, value, this.id, vcc);
            this.api.exported.Logger.info("New value received for sensor " + this.configuration.name + "(#" + this.id + "). Value : " + value + ", vcc : " + vcc);
            currentObject.save((err) => {
                if (!err) {
                    this.updateTile();
                }
            });
        }

        getStatistics(timestampBegin, timestampEnd, granularity) {

        }
    }

    api.sensorAPI.registerClass(Sensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Sensor base plugin"
};
