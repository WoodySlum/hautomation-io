"use strict";
// Internal
const Logger = require("./../../logger/Logger");
const Service = require("./../Service");
const SchedulerDbObject = require("./SchedulerDbObject");
const DbSchemaConverter = require("./../../modules/dbmanager/DbSchemaConverter");
const DbHelper = require("./../../modules/dbmanager/DbHelper");
const TimeEventService = require("./../timeeventservice/TimeEventService");
const DateUtils = require("./../../utils/DateUtils");
const sha256 = require("sha256");
const currentVersion = "0.0.0";

const IN_A_MINUTE = -1;
const IN_FIVE_MINUTES = -2;
const IN_TEN_MINUTES = -4;
const IN_THIRTY_MINUTES = -10;
const IN_A_HOUR = -100;
const IN_TWELVE_HOUR = -150;
const IN_A_DAY = -1000;

/**
 * This class allows to execute some operations in future
 * @class
 */
class SchedulerService extends Service.class {
    /**
     * Constructor
     *
     * @param  {DbManager} dbManager        A DbManager object
     * @param  {TimeEventService} timeEventService The TimeEventService instan e
     * @returns {SchedulerService}                  The instance
     */
    constructor(dbManager, timeEventService) {
        super("scheduler-service");
        this.registeredElements = [];
        this.dbManager = dbManager;
        this.timeEventService = timeEventService;
        this.dbSchema = DbSchemaConverter.class.toSchema(SchedulerDbObject.class);
        this.dbHelper = new DbHelper.class(this.dbManager, this.dbSchema, DbSchemaConverter.class.tableName(SchedulerDbObject.class), SchedulerDbObject.class);
        this.dbManager.initSchema(this.dbSchema, currentVersion, (err) => {
            if (err) {
                Logger.err(err);
            }
        });
        this.lastTriggered = DateUtils.class.timestamp();

    }

    /**
     * Start the service
     */
    start() {
        super.start();
        this.timeEventService.register(this.timeEvent, this, TimeEventService.EVERY_MINUTES);
    }

    /**
     * Stop the service
     */
    stop() {
        this.timeEventService.unregister(this.timeEvent, TimeEventService.EVERY_MINUTES);
        super.stop();
    }

    /**
     * Register a scheduler callback
     *
     * @param  {string}   id       An identifier (must be unique)
     * @param  {Function} callback A callback with an object in parameter : `(data) => {}``
     */
    register(id, callback) {
        this.registeredElements[sha256(id)] = callback;
    }

    /**
     * Unregister a scheduler callback
     *
     * @param  {string}   id       An identifier (must be unique)
     */
    unregister(id) {
        delete this.registeredElements[sha256(id)];
    }

    /**
     * Schedule an operation for a registered callback
     *
     * @param  {string}   id       An identifier (must be unique)
     * @param  {timestamp} timestamp      A timestamp or a constant : `IN_A_MINUTE`, `IN_FIVE_MINUTES`, `IN_TEN_MINUTES`, `IN_THIRTY_MINUTES`, `IN_A_HOUR`, `IN_TWELVE_HOUR`, `IN_A_DAY`
     * @param  {Object} [data={}] A data passed to callback when triggered
     */
    schedule(id, timestamp, data = {}) {
        const currentTimestamp = DateUtils.class.timestamp();
        if (!timestamp) {
            timestamp = currentTimestamp;
        }

        switch (timestamp) {
        case IN_A_MINUTE:
            timestamp = currentTimestamp + 60;
            break;
        case IN_FIVE_MINUTES:
            timestamp = currentTimestamp + 5 * 60;
            break;
        case IN_TEN_MINUTES:
            timestamp = currentTimestamp + 10 * 60;
            break;
        case IN_THIRTY_MINUTES:
            timestamp = currentTimestamp + 30 * 60;
            break;
        case IN_A_HOUR:
            timestamp = currentTimestamp + 60 * 60;
            break;
        case IN_TWELVE_HOUR:
            timestamp = currentTimestamp + 12 * 60 * 60;
            break;
        case IN_A_DAY:
            timestamp = currentTimestamp + 24 * 60 * 60;
            break;
        }

        if (data) {
            const dbObject = new SchedulerDbObject.class(this.dbHelper, sha256(id), JSON.stringify(data), timestamp);
            dbObject.save();
        }
    }

    /**
     * Timer event registered
     *
     * @param  {SchedulerService} self The SchedulerService instance
     */
    timeEvent(self) {
        const request = self.dbHelper.RequestBuilder().select().where("triggerDate", self.dbHelper.Operators().GTE, self.lastTriggered);
        self.dbHelper.getObjects(request, (err, results) => {
            if (!err && results) {
                results.forEach((schedulerDbObject) => {
                    if (self.registeredElements[schedulerDbObject.identifier]) {
                        self.registeredElements[schedulerDbObject.identifier](JSON.parse(schedulerDbObject.data));
                    }
                });
                self.lastTriggered = (Date.now() / 1000) | 0;
            }
        });
    }
}

module.exports = {class:SchedulerService,
    IN_A_MINUTE:IN_A_MINUTE,
    IN_FIVE_MINUTES:IN_FIVE_MINUTES,
    IN_TEN_MINUTES:IN_TEN_MINUTES,
    IN_THIRTY_MINUTES:IN_THIRTY_MINUTES,
    IN_A_HOUR:IN_A_HOUR,
    IN_TWELVE_HOUR:IN_TWELVE_HOUR,
    IN_A_DAY:IN_A_DAY
};
