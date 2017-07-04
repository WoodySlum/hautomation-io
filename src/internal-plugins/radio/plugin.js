/* eslint-disable */
"use strict";

const dbSchema = {"radio":[
        {"module" : {"type" : "string", "version" : "0.0.0"}},
        {"status" : {"type" : "int", "version" : "0.0.0"}}
    ]
};

const STATUS_ON = 1;
const STATUS_OFF = -1
const STATUS_ALL_ON = 100;
const STATUS_ALL_OFF = -100;

function loaded(api) {
    api.init();

    class DbRadio extends api.exported.DbObject.class {
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
        constructor(api, module) {
            this.api = api;
            this.module = module;
            this.module = api.identifier;
            this.api.databaseAPI.register(DbRadio);
            this.dbHelper = this.api.databaseAPI.dbHelper(DbRadio);
            this.api.webAPI.register(this, "*", ":/radio/get/" + this.module + "/protocol/", this.api.webAPI.Authentication().AUTH_ADMIN_LEVEL);
            // Example : http://localhost:8100/api/radio/set/rflink/blyss/134343/123/1/
            this.api.webAPI.register(this, "*", ":/radio/set/" + this.module + "/", this.api.webAPI.Authentication().AUTH_NO_LEVEL);
        }

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
         * @param  {[type]} apiRequest An APIRequest
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
                if (apiRequest.path.length === 7) {

                    const frequency = parseFloat(apiRequest.path[2]);
                    const protocol = apiRequest.path[3];
                    const deviceId = apiRequest.path[4];
                    const switchId = apiRequest.path[5];
                    const status = parseFloat(apiRequest.path[6]);
                    this.trigger(frequency, protocol, deviceId, switchId, status);
                    return new Promise((resolve, reject) => {
                        resolve(this.api.webAPI.APIResponse(true, {}));
                    });
                }

            }
        }

        save(frequency, protocol, deviceId, switchId, value, status) {
            const dbObject = new DbRadio(this.dbHelper, this.module, frequency, protocol, deviceId, switchId, value, status);
            dbObject.save();
            return dbObject;
        }

        trigger(frequency, protocol, deviceId, switchId, status) {
            this.onRadioTrigger(new DbRadio(this.dbHelper, this.module, frequency, protocol, deviceId, switchId, null, status));
        }

        onRadioTrigger(radioObject) {
            radioObject.save();
        }

        constants() {
            return {
                STATUS_ON:STATUS_ON,
                STATUS_OFF:STATUS_OFF,
                STATUS_ALL_ON:STATUS_ALL_ON,
                STATUS_ALL_OFF:STATUS_ALL_OFF
            }
        }
    }

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
