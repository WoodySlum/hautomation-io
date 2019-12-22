"use strict";

const STATUS_ON = 1;
const STATUS_OFF = -1;
const STATUS_ALL_ON = 100;
const STATUS_ALL_OFF = -100;
const DB_VERSION = "0.0.1";

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    api.init();

    /**
     * This class should not be implemented but only inherited.
     * This class is used for radio database
     * @class
     */
    class DbRadio extends api.exported.DbObject.class {
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
             * @Property("module");
             * @Type("string");
             * @Version("0.0.0");
             */
            this.module;

            /**
             * @Property("frequency");
             * @Type("double");
             * @Version("0.0.0");
             */
            this.frequency;

            /**
             * @Property("protocol");
             * @Type("string");
             * @Version("0.0.0");
             */
            this.protocol;

            /**
             * @Property("deviceId");
             * @Type("string");
             * @Version("0.0.0");
             */
            this.deviceId;

            /**
             * @Property("switchId");
             * @Type("string");
             * @Version("0.0.0");
             */
            this.switchId;

            /**
             * @Property("value");
             * @Type("number");
             * @Version("0.0.0");
             */
            this.value;

            /**
             * @Property("status");
             * @Type("double");
             * @Version("0.0.0");
             */
            this.status;

            /**
             * @Property("sensorType");
             * @Type("string");
             * @Version("0.0.1");
             */
            this.sensorType;
        }
    }

    /**
     * This class is used for radio configuration form
     * @class
     */
    class RadioConfigForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id           Identifier
         * @param  {number} autoCleanMode       Auto clean
         * @returns {RadioConfigForm}              The instance
         */
        constructor(id, autoCleanMode = 1) {
            super(id);
            /**
             * @Property("autoCleanMode");
             * @Type("number");
             * @Title("radio.config.autoCleanMode");
             * @Default(1);
             * @Enum([0, 1, 2, 3]);
             * @EnumNames(["radio.config.clean.every.month", "radio.config.clean.every.three.month", "radio.config.clean.every.year", "radio.config.clean.no"]);
             */
            this.autoCleanMode = autoCleanMode;
        }

        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {RadioConfigForm}      A form object
         */
        json(data) {
            return new RadioConfigForm(data.id, data.autoCleanMode);
        }
    }

    api.configurationAPI.register(RadioConfigForm);

    /**
     * This class is a radio master class, executing generic radio actions
     * @class
     */
    class RadioMaster {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The core APIs
         * @returns {RadioMaster}        The instance
         */
        constructor(api) {
            this.api = api;
            this.api.databaseAPI.register(DbRadio, null, DB_VERSION);
            this.dbHelper = this.api.databaseAPI.dbHelper(DbRadio);
            this.api.timeEventAPI.register((self) => {
                self.cleanRadioData(self);
            }, this, this.api.timeEventAPI.constants().EVERY_DAYS);
        }

        /**
         * Clean radio data
         *
         * @param  {RadioMaster} [context=null] The instance
         */
        cleanRadioData(context = null) {
            if (!context) {
                context = this;
            }
            const configuration = context.api.configurationAPI.getConfiguration();
            let autoCleanMode = 1;
            if (configuration) {
                autoCleanMode = parseInt(configuration.autoCleanMode);
            }

            if (autoCleanMode < 3) { // Not autoclean disabled selected
                let cleanTimestamp = context.api.exported.DateUtils.class.timestamp();
                if (autoCleanMode === 0) {
                    cleanTimestamp -= 30 * 60 * 60 * 24;
                } else if (autoCleanMode === 1) {
                    cleanTimestamp -= 3 * 30 * 60 * 60 * 24;
                } else if (autoCleanMode === 2) {
                    cleanTimestamp -= 12 * 30 * 60 * 60 * 24;
                }

                context.api.exported.Logger.info("Removing old radio data from " + cleanTimestamp);

                const requestBuilder = context.dbHelper.RequestBuilder().where(context.dbHelper.Operators().FIELD_TIMESTAMP, context.dbHelper.Operators().LT, cleanTimestamp);
                context.dbHelper.delObjects(requestBuilder, (error) => {
                    if (error) {
                        context.api.exported.Logger.err(error.message);
                    } else {
                        context.api.exported.Logger.info("Radio data successfully cleaned");
                    }
                });
            }
        }
    }

    new RadioMaster(api);

    /**
     * This class shoud be extended by radio modules
     * @class
     */
    class Radio {
        /**
         * Constructor (called with super)
         *
         * @param  {PluginAPI} api The core APIs
         * @returns {Radio}        The instance
         */
        constructor(api) {
            this.api = api;
            this.module = api.identifier;
            this.api.databaseAPI.register(DbRadio);
            this.dbHelper = this.api.databaseAPI.dbHelper(DbRadio);
            this.api.webAPI.register(this, this.api.webAPI.constants().GET, ":/radio/get/" + this.module + "/protocol/", this.api.webAPI.Authentication().AUTH_ADMIN_LEVEL);
            // Example : http://localhost:8100/api/radio/set/rflink/blyss/134343/123/1/
            this.api.webAPI.register(this, this.api.webAPI.constants().POST, ":/radio/set/" + this.module + "/[protocol]/[deviceId]/[switchId]/[status]/[frequency*]/", this.api.webAPI.Authentication().AUTH_USAGE_LEVEL);
            this.registered = [];
            this.api.registerInstance(this);
        }

        /**
         * @override
         * Return the list of supported protocolList
         * Can be overridden
         *
         * @param  {Function} cb A callback function `(err, protocols) => {}`
         */
        getProtocolList(cb) {
            const request = this.dbHelper.RequestBuilder()
                .distinct()
                .select("protocol")
                .where("module", this.dbHelper.Operators().EQ, this.module)
                .order(this.dbHelper.Operators().ASC, "protocol");
            this.dbHelper.getObjects(request, (err, dbRadioObjects) => {
                if (!err) {
                    const protocolList = [];
                    dbRadioObjects.forEach((dbRadioObject) => {
                        protocolList.push(dbRadioObject.protocol);
                    });
                    cb(null, protocolList);
                } else {
                    cb(err);
                }
            });
        }

        /**
         * Return the list of last radio information received
         *
         * @param  {Function} cb A callback function `(err, objects) => {}`
         * @param  {number}   [nbElements=100] Max number elements
         */
        getLastReceivedRadioInformations(cb, nbElements = 100) {
            const request = this.dbHelper.RequestBuilder()
                .select()
                .where("module", this.dbHelper.Operators().EQ, this.module)
                .order(this.dbHelper.Operators().DESC, this.dbHelper.Operators().FIELD_TIMESTAMP)
                .first(nbElements);
            this.dbHelper.getObjects(request, (err, dbRadioObjects) => {
                if (!err) {
                    cb(null, dbRadioObjects);
                } else {
                    cb(err);
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
            if (apiRequest.route === ":/radio/get/" + this.module + "/protocol/") {
                return new Promise((resolve, reject) => {
                    self.getProtocolList((err, protocolList) => {
                        if (!err) {
                            resolve(this.api.webAPI.APIResponse(true, protocolList));
                        } else {
                            reject(this.api.webAPI.APIResponse(false, {}, 6523, err.message));
                        }
                    });
                });
            } else if (apiRequest.route.startsWith(":/radio/set/" + this.module + "/")) {
                if (apiRequest.data.protocol && apiRequest.data.deviceId && apiRequest.data.switchId && apiRequest.data.status) {
                    const frequency = apiRequest.data.frequency?apiRequest.data.frequency:this.defaultFrequency();
                    this.emit(frequency, apiRequest.data.protocol, apiRequest.data.deviceId, apiRequest.data.switchId, apiRequest.data.status);
                    return new Promise((resolve) => {
                        resolve(this.api.webAPI.APIResponse(true, {success:true}));
                    });
                }
            } else {
                return new Promise((resolve, reject) => {
                    reject(this.api.webAPI.APIResponse(false, {}, 4603, "Unknown method"));
                });
            }
        }

        /**
         * @override
         * Returns the default frequency
         *
         * @returns {number} Default frequency
         */
        defaultFrequency() {
            return 433.92;
        }

        /**
         * @override
         * Emit radio request
         *
         * @param  {number} frequency The frequency
         * @param  {string} protocol  The protocol
         * @param  {string} deviceId  The device ID
         * @param  {string} switchId  The switch ID
         * @param  {number} [status=null]    The status (or enum called through `constants()`)
         * @param  {number} [previousStatus=null]    The previous object status, used if status is null to invert
         * @param  {DeviceStatus} [deviceStatus=null]    The device status (color, bright, ...)
         * @returns {DbRadio}           A radio  object
         */
        emit(frequency, protocol, deviceId, switchId, status = null, previousStatus = null, deviceStatus = null) {
            if (!status && previousStatus) {
                status = -1 * previousStatus;
            }
            if (!frequency) {
                frequency = this.defaultFrequency();
            }
            let dbObject = new DbRadio(this.dbHelper, this.module, frequency, protocol, deviceId, switchId, null, status, null, null);
            this.onRadioEvent(frequency, protocol, deviceId, switchId, null, status, deviceStatus);
            return dbObject;
        }

        /**
         * @override
         * Called when a radio event is received
         *
         * @param  {number} frequency The frequency
         * @param  {string} protocol  The protocol
         * @param  {string} deviceId  The device ID
         * @param  {string} switchId  The switch ID
         * @param  {number} value  The value
         * @param  {number} status    The status (or enum called through `constants()`)
         * @param  {string} [sensorType=null]    The sensor type
         * @returns {DbRadio}           A radio  object
         */
        onRadioEvent(frequency, protocol, deviceId, switchId, value, status, sensorType = null) {
            let dbObject = new DbRadio(this.dbHelper, this.module, frequency, protocol, deviceId, switchId, value, status, sensorType);
            this.registered.forEach((register) => {
                if (register.onRadioEvent instanceof Function) {
                    register.onRadioEvent(dbObject);
                }
            });

            dbObject.save();
            return dbObject;
        }

        /**
         * Return the constants
         *
         * @returns {Object} The constants
         */
        constants() {
            return {
                STATUS_ON:STATUS_ON,
                STATUS_OFF:STATUS_OFF,
                STATUS_ALL_ON:STATUS_ALL_ON,
                STATUS_ALL_OFF:STATUS_ALL_OFF
            };
        }

        /**
         * Register an object to radio events
         *
         * @param  {Object} o An object that implements callback
         */
        register(o) {
            if (this.registered.indexOf(o) === -1) {
                this.registered.push(o);
            }
        }

        /**
         * Unregister an object to radio events
         *
         * @param  {Object} o An object that implements callback
         */
        unregister(o) {
            const index = this.registered.indexOf(o);
            if (index !== -1) {
                this.registered.splice(index, 1);
            }
        }

        /**
         * Register radio sensor values (static)
         *
         * @param  {PluginAPI} api The plugin API
         * @param  {Sensor} sensorInstance A sensor class inherited object
         * @param  {Function} [cb=null] A callback such as `(radioObject) => {}`
         */
        static registerSensor(api, sensorInstance, cb = null) {
            api.radioAPI.register((radioObject) => {
                if (radioObject && sensorInstance.configuration && sensorInstance.configuration.radio && sensorInstance.configuration.radio.length > 0) {
                    // Report battery values
                    sensorInstance.configuration.radio.forEach((radioConfiguration) => {
                        if (radioConfiguration.module.toString() === radioObject.module.toString()
                            && radioConfiguration.protocol.toString() === radioObject.protocol.toString()
                            && radioConfiguration.deviceId.toString() === radioObject.deviceId.toString()
                            && radioConfiguration.switchId.toString() === radioObject.switchId.toString()) {
                            if (radioObject.sensorType === "BATTERY") {
                                Object.keys(api.sensorAPI.getSensors()).forEach((sensorKey) => {
                                    const sensor = api.sensorAPI.getSensor(sensorKey);
                                    let found = false;
                                    if (sensor.configuration && sensor.configuration.radio && sensor.configuration.radio.length > 0) {
                                        sensor.configuration.radio.forEach((radioConfiguration) => {
                                            if (radioConfiguration.module.toString() === radioObject.module.toString()
                                                && radioConfiguration.protocol.toString() === radioObject.protocol.toString()
                                                && radioConfiguration.deviceId.toString() === radioObject.deviceId.toString()
                                                && radioConfiguration.switchId.toString() === radioObject.switchId.toString()) {
                                                    found = true;
                                                }
                                        });
                                    }

                                    if (found) {
                                        sensor.lastObject((err, res) => {
                                            if (!err) {
                                                res.battery = radioObject.value;
                                                res.save((err) => {
                                                    // console.log(err);
                                                    // console.log(err);
                                                    // console.log(err);
                                                    // console.log(err);
                                                    // console.log(err);
                                                });
                                                console.log(res);
                                            }
                                        });
                                    }
                                });
                            }

                            if (radioObject.sensorType) {
                                if (radioObject.sensorType === sensorInstance.type) {
                                    if (cb) {
                                        cb(radioObject);
                                    } else {
                                        sensorInstance.setValue(parseFloat(radioObject.value));
                                    }
                                }
                            } else {
                                if (cb) {
                                    cb(radioObject);
                                } else {
                                    sensorInstance.setValue(parseFloat(radioObject.value));
                                }
                            }
                        }
                    });
                }
            }, sensorInstance.id);
        }
    }

    // Export classes
    api.exportClass(DbRadio);
    api.exportClass(Radio);
}

module.exports = {STATUS_ON:STATUS_ON, STATUS_OFF:STATUS_OFF, STATUS_ALL_ON:STATUS_ALL_ON, STATUS_ALL_OFF:STATUS_ALL_OFF};
module.exports.attributes = {
    loadedCallback: loaded,
    name: "radio",
    version: "0.0.1",
    category: "radio",
    description: "Parent class for radio devices",
    dependencies:[],
    classes:[]
};
