"use strict";
const sha256 = require("sha256");
const Logger = require("./../../logger/Logger");
const WebServices = require("./../../services/webservices/WebServices");
const APIResponse = require("./../../services/webservices/APIResponse");
const Authentication = require("./../authentication/Authentication");
const DateUtils = require("./../../utils/DateUtils");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");
const SensorsForm = require("./SensorsForm");
const SensorsListForm = require("./SensorsListForm");

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

const ERROR_ALREADY_REGISTERED = "Already registered";
const ERROR_NOT_REGISTERED = "Not registered";

const DAILY = "daily";
const MONTHLY = "monthly";
const YEARLY = "yearly";

const SENSOR_NAME_COMPARE_CONFIDENCE = 0.31;
const EVENT_SENSORS_READY = "event-sensors-ready";

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
     * @param  {BotEngine} botEngine    The bot engine
     * @param  {TimeEventService} timeEventService    The time event service
     * @returns {SensorsManager}                       The instance
     */
    constructor(pluginsManager, eventBus, webServices, formManager, confManager, translateManager, themeManager, botEngine, timeEventService) {
        this.pluginsManager = pluginsManager;
        this.webServices = webServices;
        this.formManager = formManager;
        this.confManager = confManager;
        this.translateManager = translateManager;
        this.themeManager = themeManager;
        this.botEngine = botEngine;
        this.timeEventService = timeEventService;
        this.sensors = [];
        this.delegates = {};
        this.statisticsCache = {};
        this.eventBus = eventBus;

        try {
            this.sensorsConfiguration = this.confManager.loadData(Object, CONF_MANAGER_KEY, true);
        } catch(e) {
            Logger.warn(e.message);
        }

        if (!this.sensorsConfiguration) {
            this.sensorsConfiguration = [];
        }

        const self = this;
        self.eventBus.on(require("./../pluginsmanager/PluginsManager").EVENT_LOADED, (pluginsManager) => {
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

        this.botEngine.registerBotAction("sensor", (action, value, type, confidence, sender, cb) => {
            let maxConfidence = 0;
            let detectedSensor = null;
            this.sensors.forEach((sensor) => {
                const stringConfidence = this.botEngine.stringSimilarity().compareTwoStrings(sensor.type + " " + sensor.name, value);
                if (stringConfidence >= SENSOR_NAME_COMPARE_CONFIDENCE && stringConfidence > maxConfidence) {
                    detectedSensor = sensor;
                    maxConfidence = stringConfidence;
                }
            });

            if (detectedSensor) {
                Logger.info("Match found ! : " + detectedSensor.name);
                detectedSensor.lastObject((err, lastObject) => {
                    if (lastObject && lastObject.value) {
                        const convertedValue = detectedSensor.convertValue(lastObject.value);
                        cb(this.translateManager.t("sensor.bot", convertedValue.value, convertedValue.unit, detectedSensor.name));
                    } else {
                        cb(this.translateManager.t("sensor.bot.notfound"));
                    }
                });
            } else {
                cb(this.translateManager.t("sensor.bot.notfound"));
            }
        });

        // Consolidate statistics in cache every hours
        this.timeEventService.register((self) => {
            Logger.verbose("Consolidating statistics ...");
            setTimeout(() => {
                self.statisticsCache[DAILY] = self.statisticsWsResponse(DateUtils.class.timestamp(), 24 * 60 * 60, 60 * 60, self.translateManager.t("sensors.statistics.day.dateformat"));
                Logger.verbose("Consolidating daily statistics ... Done.");
            }, 10);

            setTimeout(() => {
                self.statisticsCache[MONTHLY] = self.statisticsWsResponse(DateUtils.class.timestamp(), 31 * 24 * 60 * 60, 24 * 60 * 60, self.translateManager.t("sensors.statistics.month.dateformat"), (timestamp) => {
                    return DateUtils.class.roundedTimestamp(timestamp, DateUtils.ROUND_TIMESTAMP_DAY);
                }, "%Y-%m-%d 00:00:00");
                Logger.verbose("Consolidating monthly statistics ... Done.");
            }, 100);


            setTimeout(() => {
                self.statisticsCache[YEARLY] = this.statisticsWsResponse(DateUtils.class.timestamp(), 12 * 31 * 24 * 60 * 60, 31 * 24 * 60 * 60, self.translateManager.t("sensors.statistics.year.dateformat"), (timestamp) => {
                    return DateUtils.class.roundedTimestamp(timestamp, DateUtils.ROUND_TIMESTAMP_MONTH);
                }, "%Y-%m-01 00:00:00");
                Logger.verbose("Consolidating yearly statistics ... Done.");
            }, 200);


        }, this, TimeEventService.EVERY_HOURS);
    }

    /**
     * Called automatically when plugins are loaded. Used in separate methods for testing.
     * Initially, this method wad used in contructor.
     *
     * @param  {PluginsManager} pluginsManager The plugins manager instance
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

        // Register forms
        const ids = [];
        const names = [];
        this.sensors.forEach((sensor) => {
            ids.push(sensor.id);
            names.push(sensor.name);
        });
        this.formManager.register(SensorsForm.class, ids, names);
        this.registerSensorsListForm();

        this.eventBus.emit(EVENT_SENSORS_READY);
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
     * Register a callback for a/all sensor
     *
     * @param  {Function} cb               A callback `(id, type, value, unit, vcc, aggValue, aggUnit) => {}`
     * @param  {string}   [identifier="*"] A sensor identifier (retrieved through `getAllSensors()`, or `*` for all)
     * @param  {string}   [type="*"]       A sensor type. For all types, use `*`
     */
    registerSensorEvent(cb, identifier = "*", type = "*") {
        const id = sha256(cb.toString() + identifier + type);
        this.delegates[id] = {identifier:identifier, type:type, cb:cb};
    }

    /**
     * Get sensor by identifier
     *
     * @param  {string} identifier An identiifer
     * @returns {Sensor}            A sensor object
     */
    getSensor(identifier) {
        let sensor = null;
        this.sensors.forEach((s) => {
            if (parseInt(s.id) === parseInt(identifier)) {
                sensor = s;
            }
        });

        return sensor;
    }

    /**
     * Unregister a callback for a/all sensor
     *
     * @param  {Function} cb               A callback `(id, type, value, unit, vcc, aggValue, aggUnit) => {}`
     * @param  {string}   [identifier="*"] A sensor identifier (retrieved through `getAllSensors()`, or `*` for all)
     * @param  {string}   [type="*"]       A sensor type. For all types, use `*`
     */
    unregisterSensorEvent(cb, identifier = "*", type = "*") {
        const id = sha256(cb.toString() + identifier + type);
        if (this.delegates[id]) {
            delete this.delegates[id];
        } else {
            throw Error(ERROR_NOT_REGISTERED);
        }
    }

    /**
     * Get all sensors
     *
     * @param  {string} [type=null] Sensor's type or category. If not specified, send back all sensors.
     *
     * @returns {Object} On object with id:name
     */
    getAllSensors(type = null) {
        const sensors = {};
        this.sensors.forEach((sensor) => {
            if (!type || (sensor.type === type)) {
                sensors[sensor.id] = sensor.name;
            }
        });

        return sensors;
    }

    /**
     * Callback when a sensor receives a value
     *
     * @param  {number} id       The identifier
     * @param  {string} type     The type
     * @param  {number} value    The raw value
     * @param  {string} unit     The raw unit
     * @param  {number} vcc      The sensor's voltage
     * @param  {number} aggValue The aggregated value
     * @param  {string} aggUnit  The aggregated unit
     */
    onNewSensorValue(id, type, value, unit, vcc, aggValue, aggUnit) {
        Object.keys(this.delegates).forEach((key) => {
            const registeredEl = this.delegates[key];
            if ((registeredEl.type === "*" || (registeredEl.type === type))
                && (registeredEl.identifier === "*" || (parseInt(registeredEl.identifier) === parseInt(id)))
                && registeredEl.cb) {
                registeredEl.cb(id, type, value, unit, vcc, aggValue, aggUnit);
            }
        });
    }

    /**
     * Get a sensor's value
     *
     * @param  {number}   id              The sensor's identifier
     * @param  {Function} cb              A callback e.g. `(err, res) => {}`
     * @param  {number}   [duration=null] A duration in seconds. If null or not provided, will provide last inserted database value.
     */
    getValue(id, cb, duration = null) {
        this.sensors.forEach((sensor) => {
            if (parseInt(id) === parseInt(sensor.id)) {
                sensor.lastObject((err, res) => {
                    if (!err) {
                        const val = Object.assign({}, res);
                        delete val.dbHelper;
                        cb(err, val);
                    } else {
                        cb(err, null);
                    }
                }, duration);
            }
        });
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
                        const form = self.formManager.getForm(sensor.sensorAPI.form);
                        sensors.push({
                            identifier: sensor.identifier,
                            description: sensor.description,
                            form: form
                        });

                        sensors.sort((a,b) => a.description.localeCompare(b.description));
                    }
                });
                resolve(new APIResponse.class(true, sensors));
            });
        } else if (apiRequest.route === SENSORS_MANAGER_GET) {
            return new Promise((resolve) => {
                const sensors = [];
                self.sensorsConfiguration.forEach((sensor) => {
                    if (self.pluginsManager.isEnabled(sensor.plugin)) {
                        const sensorPlugin = self.pluginsManager.getPluginByIdentifier(sensor.plugin, false);
                        const s = self.getSensor(sensor.id);
                        sensors.push({
                            identifier: sensor.id,
                            name: sensor.name,
                            icon: (s?s.icon:"E8BC"),
                            category: (s?s.type:"UNKNOWN"),
                            form:Object.assign(self.formManager.getForm(sensorPlugin.sensorAPI.form), {data:sensor})
                        });
                    }

                    sensors.sort((a,b) => a.name.localeCompare(b.name));
                });
                resolve(new APIResponse.class(true, sensors));
            });
        } else if (apiRequest.route.startsWith(SENSORS_MANAGER_POST_BASE)) {
            return new Promise((resolve, reject) => {
                if (apiRequest.data && Object.keys(apiRequest.data).length > 1) {
                    if (apiRequest.data.plugin) {
                        if (self.pluginsManager.getPluginByIdentifier(apiRequest.data.plugin, false) && self.pluginsManager.isEnabled(apiRequest.data.plugin)) {
                            // Set id
                            if (!apiRequest.data.id) {
                                apiRequest.data.id = DateUtils.class.timestamp();
                            } else {
                                apiRequest.data.id = parseInt(apiRequest.data.id);
                            }

                            self.sensorsConfiguration = self.confManager.setData(CONF_MANAGER_KEY, apiRequest.data, self.sensorsConfiguration, self.comparator);
                            self.initSensors();
                            resolve(new APIResponse.class(true, {success:true, id:apiRequest.data.id}));
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
            if (!this.statisticsCache[DAILY]) {
                Logger.info("Missing daily statistics cache, generating data");
                this.statisticsCache[DAILY] = this.statisticsWsResponse(DateUtils.class.timestamp(), 24 * 60 * 60, 60 * 60, this.translateManager.t("sensors.statistics.day.dateformat"));
            }

            return this.statisticsCache[DAILY];
        } else if (apiRequest.route === SENSORS_MANAGER_STATISTICS_MONTH) {
            if (!this.statisticsCache[MONTHLY]) {
                Logger.info("Missing monthly statistics cache, generating data");
                this.statisticsCache[MONTHLY] = this.statisticsWsResponse(DateUtils.class.timestamp(), 31 * 24 * 60 * 60, 24 * 60 * 60, this.translateManager.t("sensors.statistics.month.dateformat"), (timestamp) => {
                    return DateUtils.class.roundedTimestamp(timestamp, DateUtils.ROUND_TIMESTAMP_DAY);
                }, "%Y-%m-%d 00:00:00");
            }

            return this.statisticsCache[MONTHLY];
        } else if (apiRequest.route === SENSORS_MANAGER_STATISTICS_YEAR) {
            if (!this.statisticsCache[YEARLY]) {
                Logger.info("Missing yearly statistics cache, generating data");
                this.statisticsCache[YEARLY] = this.statisticsWsResponse(DateUtils.class.timestamp(), 12 * 31 * 24 * 60 * 60, 31 * 24 * 60 * 60, this.translateManager.t("sensors.statistics.year.dateformat"), (timestamp) => {
                    return DateUtils.class.roundedTimestamp(timestamp, DateUtils.ROUND_TIMESTAMP_MONTH);
                }, "%Y-%m-01 00:00:00");
            }

            return this.statisticsCache[YEARLY];
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
     * @param {string}    [roundDateSqlFormat=null] In relation with roundTimeStampFunction, the SQL date format. E.g. : "%Y-%m-01 00:00:00"
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
                    }, roundTimestampFunction, roundDateSqlFormat);
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

    /**
     * Get sensor configuration. If no parameters are passed, returns the array of all sensor configuration.
     *
     * @param  {string} [sensorId=null] The sensor identifier. Can be null.
     * @returns {Object}                 The sensor configuration, or configurations, or null if nothing found
     */
    getSensorConfiguration(sensorId = null) {
        if (!sensorId) {
            return this.sensorsConfiguration;
        } else {
            let foundConfiguration = null;
            this.sensorsConfiguration.forEach((sensorConfiguration) => {
                if (sensorConfiguration.id === sensorId) {
                    foundConfiguration = sensorConfiguration;
                }
            });

            return foundConfiguration;
        }
    }

    /**
     * Register a sensors list form
     */
    registerSensorsListForm() {
        const sensorsName = [];
        const sensorsId = [];

        this.sensorsConfiguration.sort((a,b) => a.name.localeCompare(b.name)).forEach((sensor) => {
            sensorsName.push(sensor.name);
            sensorsId.push(sensor.id);
        });
        this.formManager.register(SensorsListForm.class, sensorsName, sensorsId);
    }
}

module.exports = {class:SensorsManager, ERROR_ALREADY_REGISTERED:ERROR_ALREADY_REGISTERED, ERROR_NOT_REGISTERED:ERROR_NOT_REGISTERED, EVENT_SENSORS_READY:EVENT_SENSORS_READY};
