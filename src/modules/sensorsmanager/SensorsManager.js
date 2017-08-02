"use strict";
const Logger = require("./../../logger/Logger");
const PluginsManager = require("./../pluginsmanager/PluginsManager");
const WebServices = require("./../../services/webservices/WebServices");
const APIResponse = require("./../../services/webservices/APIResponse");
const Authentication = require("./../authentication/Authentication");
const DateUtils = require("./../../utils/DateUtils");

const CONF_MANAGER_KEY = "sensors";
const SENSORS_MANAGER_AVAILABLE_GET = ":/sensors/available/get/";
const SENSORS_MANAGER_POST_BASE = ":/sensors/set";
const SENSORS_MANAGER_POST = SENSORS_MANAGER_POST_BASE + "/[id*]/";
const SENSORS_MANAGER_GET = ":/sensors/get/";
const SENSORS_MANAGER_DEL_BASE = ":/sensors/del";
const SENSORS_MANAGER_DEL = SENSORS_MANAGER_DEL_BASE + "/[id*]/";
const SENSORS_MANAGER_STATISTICS_DAY = ":/sensors/statistics/day/";
const SENSORS_MANAGER_STATISTICS_MONTH = ":/sensors/statistics/month/";
const SENSORS_MANAGER_STATISTICS_YEAR = ":/sensors/statistics/year/";

/**
 * This class allows to manage sensors
 * @class
 */
class SensorsManager {
    /**
     * Constructor
     *
     * @param  {PluginsManager} pluginsManager A plugin manager
     * @param  {EventEmitter} eventBus    The global event bus
     * @param  {WebServices} webServices    The web services
     * @param  {FormManager} formManager    The form manager
     * @param  {ConfManager} confManager    The configuration manager
     * @param  {TranslateManager} translateManager    The translate manager
     * @param  {ThemeManager} themeManager    The theme manager
     * @returns {SensorsManager}                       The instance
     */
    constructor(pluginsManager, eventBus, webServices, formManager, confManager, translateManager, themeManager) {
        this.pluginsManager = pluginsManager;
        this.webServices = webServices;
        this.formManager = formManager;
        this.confManager = confManager;
        this.translateManager = translateManager;
        this.themeManager = themeManager;
        this.sensors = [];
        try {
            this.sensorsConfiguration = this.confManager.loadData(Object, CONF_MANAGER_KEY, true);
        } catch(e) {
            Logger.warn(e.message);
            this.sensorsConfiguration= [];
        }

        const self = this;
        eventBus.on(PluginsManager.EVENT_LOADED, (pluginsManager) => {
            self.pluginsLoaded(pluginsManager, self);
        });

        // Web services
        this.webServices.registerAPI(this, WebServices.GET, SENSORS_MANAGER_AVAILABLE_GET, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, SENSORS_MANAGER_GET, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, SENSORS_MANAGER_POST, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.DELETE, SENSORS_MANAGER_DEL, Authentication.AUTH_ADMIN_LEVEL);

        this.webServices.registerAPI(this, WebServices.GET, SENSORS_MANAGER_STATISTICS_DAY, Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, SENSORS_MANAGER_STATISTICS_MONTH, Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, SENSORS_MANAGER_STATISTICS_YEAR, Authentication.AUTH_USAGE_LEVEL);
    }

    /**
     * Called automatically when plugins are loaded. Used in separate methods for testing.
     * Initially, this method wad used in contructor.
     *
     * @param  {PluginsManager} pluginsManager THe plugins manager instance
     * @param  {SensorsManager} context        The context (self, this, etc ...)
     */
    pluginsLoaded(pluginsManager, context) {
        context.pluginsManager = pluginsManager;
        context.initSensors();
    }

    /**
     * Initialize sensors
     */
    initSensors() {
        this.sensors = [];
        this.sensorsConfiguration.forEach((sensorConfiguration) => {
            this.initSensor(sensorConfiguration);
        });
    }

    /**
     * Init a sensor instance and add to local array
     *
     * @param  {Object} configuration The sensor configuration
     */
    initSensor(configuration) {
        if (configuration.plugin) {
            const p = this.pluginsManager.getPluginByIdentifier(configuration.plugin, false);
            if (p) {
                if (p.sensorAPI.sensorClass) {
                    const sensor = new p.sensorAPI.sensorClass(p, configuration.id, configuration);
                    sensor.init();
                    this.sensors.push(sensor);

                    Logger.info("Sensor '" + configuration.name + "' loaded (#" + configuration.id + ")");
                } else {
                    Logger.err("Plugin " + configuration.plugin + " does not have linked sensor class");
                }
            } else {
                Logger.err("Plugin " + configuration.plugin + " can not be found");
            }
        } else {
            Logger.err("No plugin associated found for sensor " + configuration.name);
        }
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        const self = this;
        if (apiRequest.route === SENSORS_MANAGER_AVAILABLE_GET) {
            return new Promise((resolve) => {
                const sensors = [];
                self.pluginsManager.getPluginsByCategory("sensor", false).forEach((sensor) => {
                    if (sensor.sensorAPI.form) {
                        sensors.push({
                            identifier: sensor.identifier,
                            description: sensor.description,
                            form:self.formManager.getForm(sensor.sensorAPI.form)
                        });
                    }
                });
                resolve(new APIResponse.class(true, sensors));
            });
        } else if (apiRequest.route === SENSORS_MANAGER_GET) {
            return new Promise((resolve) => {
                const sensors = [];
                self.sensorsConfiguration.forEach((sensor) => {
                    const sensorPlugin = self.pluginsManager.getPluginByIdentifier(sensor.plugin, false);
                    sensors.push({
                        identifier: sensor.id,
                        name: sensor.name,
                        icon: "E8BC",
                        category:"TEST",
                        form:Object.assign(self.formManager.getForm(sensorPlugin.sensorAPI.form), {data:sensor})
                    });
                });
                resolve(new APIResponse.class(true, sensors));
            });
        } else if (apiRequest.route.startsWith(SENSORS_MANAGER_POST_BASE)) {
            return new Promise((resolve, reject) => {
                if (apiRequest.data) {
                    if (apiRequest.data.plugin) {
                        if (self.pluginsManager.getPluginByIdentifier(apiRequest.data.plugin, false)) {
                            // Set id
                            if (!apiRequest.data.id) {
                                apiRequest.data.id = DateUtils.class.timestamp();
                            } else {
                                apiRequest.data.id = parseInt(apiRequest.data.id);
                            }

                            self.sensorsConfiguration = self.confManager.setData(CONF_MANAGER_KEY, apiRequest.data, self.sensorsConfiguration, self.comparator);
                            self.initSensors();
                            resolve(new APIResponse.class(true, {success:true}));
                        } else {
                            reject(new APIResponse.class(false, {}, 8108, "Unexisting plugin found"));
                        }
                    } else {
                        reject(new APIResponse.class(false, {}, 8107, "No plugin attached"));
                    }
                } else {
                    reject(new APIResponse.class(false, {}, 8106, "No data request"));
                }

            });
        } else if (apiRequest.route.startsWith(SENSORS_MANAGER_DEL_BASE)) {
            return new Promise((resolve, reject) => {
                try {
                    self.confManager.removeData(CONF_MANAGER_KEY, {id:parseInt(apiRequest.data.id)}, self.sensorsConfiguration, self.comparator);
                    self.initSensors();
                    resolve(new APIResponse.class(true, {success:true}));
                } catch(e) {
                    reject(new APIResponse.class(false, {}, 8109, e.message));
                }
            });
        } else if (apiRequest.route === SENSORS_MANAGER_STATISTICS_DAY) {
            return this.statisticsWsResponse(DateUtils.class.timestamp(), 24 * 60 * 60, 60 * 60, this.translateManager.t("sensors.statistics.day.dateformat"));
        } else if (apiRequest.route === SENSORS_MANAGER_STATISTICS_MONTH) {
            return this.statisticsWsResponse(DateUtils.class.timestamp(), 31 * 24 * 60 * 60, 24 * 60 * 60, this.translateManager.t("sensors.statistics.month.dateformat"), (timestamp) => {
                return DateUtils.class.roundedTimestamp(timestamp, DateUtils.ROUND_TIMESTAMP_DAY);
            }, "%Y-%m-%d 00:00:00");
        } else if (apiRequest.route === SENSORS_MANAGER_STATISTICS_YEAR) {
            return this.statisticsWsResponse(DateUtils.class.roundedTimestamp(DateUtils.class.timestamp(), DateUtils.ROUND_TIMESTAMP_MONTH), 12 * 31 * 24 * 60 * 60, 31 * 24 * 60 * 60, this.translateManager.t("sensors.statistics.year.dateformat"), (timestamp) => {
                return DateUtils.class.roundedTimestamp(timestamp, DateUtils.ROUND_TIMESTAMP_MONTH);
            }, "%Y-%m-01 00:00:00");
        }
    }

    /**
     * Build a statistics data
     *
     * @param  {number} endTimestamp      The end timestamp for aggregation
     * @param  {number} duration          A duration in seconds (period)
     * @param  {number} aggregation       The aggregation in seconds
     * @param  {string} displayDateFormat The display date format
     * @param  {Function} [roundTimestampFunction=null]  A  e.g. `(timestamp) => {return  timestamp;}`
     * @param {String}    [roundDateSqlFormat=null] In relation with roundTimeStampFunction, the SQL date format. E.g. : "%Y-%m-01 00:00:00"
     * @returns {Promise}                   A promise
     */
    statisticsWsResponse(endTimestamp, duration, aggregation, displayDateFormat, roundTimestampFunction = null, roundDateSqlFormat = null) {
        const self = this;
        return new Promise((resolve, reject) => {
            const eligibleSensors = [];
            self.sensors.forEach((sensor) => {
                if (sensor.configuration.statistics) {
                    eligibleSensors.push(sensor);
                }
            });

            if (eligibleSensors.length === 0) {
                reject(new APIResponse.class(false, {}, 8110, "No sensors eligible for statistics"));
            } else {
                let retrievalCounter = 0;
                const globalResults = {x:[]};

                eligibleSensors.forEach((sensor) => {
                    sensor.getStatistics(endTimestamp - duration, endTimestamp, aggregation, (error, results) => {
                        if (!error && results) {
                            if (globalResults.x.length === 0) {
                                // Populating x
                                Object.keys(results.values).forEach((timestamp) => {
                                    globalResults.x.push({ts:parseInt(timestamp), datetime:DateUtils.class.dateFormatted("YYYY-MM-DD HH:mm:ss", timestamp), formatted:DateUtils.class.dateFormatted(displayDateFormat, timestamp)});
                                });
                            }

                            if (globalResults.x.length === Object.keys(results.values).length) {
                                if (!globalResults[results.unit]) {
                                    globalResults[results.unit] = {};
                                }

                                globalResults[results.unit][sensor.id] = {name: sensor.configuration.name, color:(sensor.configuration.statisticsColor?sensor.configuration.statisticsColor:this.themeManager.getColors().primaryColor), chartType:sensor.chartType, values:[]};
                                Object.keys(results.values).forEach((timestamp) => {
                                    globalResults[results.unit][sensor.id].values.push(results.values[timestamp]);
                                });
                            } else {
                                Logger.err("Sensor #" + sensor.id + " statistics count are different (x / values). Could not provide informations");
                                Logger.verbose(globalResults.x);
                                Logger.verbose(results);
                            }


                        }

                        retrievalCounter++;
                        if (retrievalCounter === eligibleSensors.length) {
                            resolve(new APIResponse.class(true, globalResults));
                        }
                    });
                });
            }
        });
    }

    /**
     * Compare sensor data
     *
     * @param  {Object} sensorData1 Sensor data 1
     * @param  {Object} sensorData2 Sensor data 2
     * @returns {boolean}             True if id is the same, false otherwise
     */
    comparator(sensorData1, sensorData2) {
        return (sensorData1.id === sensorData2.id);
    }
}

module.exports = {class:SensorsManager};
