"use strict";

const STATUS_ON = 1;
const STATUS_OFF = -1;
const STATUS_ALL_ON = 100;
const STATUS_ALL_OFF = -100;

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

        }
    }

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
                    });console.log(cb);
                    cb(null, protocolList);
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
         * @param  {number} status    The status (or enum called through `constants()`
         * @returns {DbRadio}           A radio  object
         */
        emit(frequency, protocol, deviceId, switchId, status) {
            let dbObject = new DbRadio(this.dbHelper, this.module, frequency, protocol, deviceId, switchId, null, status);
            this.onRadioEvent(frequency, protocol, deviceId, switchId, null, status);
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
         * @param  {number} status    The status (or enum called through `constants()`
         * @returns {DbRadio}           A radio  object
         */
        onRadioEvent(frequency, protocol, deviceId, switchId, value, status) {
            let dbObject = new DbRadio(this.dbHelper, this.module, frequency, protocol, deviceId, switchId, value, status);
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
    }

    // Export classes
    api.exportClass(DbRadio);
    api.exportClass(Radio);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "radio",
    version: "0.0.0",
    category: "radio",
    description: "Parent class for radio devices",
    dependencies:[],
    classes:[]
};
