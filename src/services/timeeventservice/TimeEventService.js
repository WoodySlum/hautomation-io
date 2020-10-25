"use strict";
// Internal
var Logger = require("./../../logger/Logger");
var Service = require("./../Service");
const sha256 = require("sha256");
const stackTrace = require("stack-trace");

const EVERY_SECONDS = 0;
const EVERY_MINUTES = 1;
const EVERY_HOURS = 2;
const EVERY_DAYS = 3;
const EVERY_HOURS_INACCURATE = 4;
const EVERY_FIVE_MINUTES = 5;
const EVERY_FIFTEEN_MINUTES = 6;
const EVERY_THIRTY_MINUTES = 7;
const CUSTOM = 99;

/**
 * This class allows registered items to be notified on tile recursively
 * @class
 */
class TimeEventService extends Service.class {

    /**
     * Constructor
     *
     * @returns {TimeEventService}            The instance
     */
    constructor() {
        super("time-event-service");
        this.timer = null;
        this.registeredElements = [];
    }

    /**
     * Start the service
     */
    start() {
        if (this.status != Service.RUNNING) {
            this.timer = setInterval(this.timeEvent, 1000, this);
            super.start();
        }
    }

    /**
     * Stop the service
     */
    stop() {
        if (this.timer && this.status == Service.RUNNING) {
            clearInterval(this.timer);
            super.stop();
        }
    }

    /**
     * Compute a SHA256 hash for the registered object
     *
     * @param  {Function} cb            A callback
     * @param  {int}   mode          Mode (enum) : `EVERY_SECONDS`, `EVERY_MINUTES`, `EVERY_HOURS`, `EVERY_DAYS` or `CUSTOM`
     * @param  {string}   [hour=null]   An hour
     * @param  {string}   [minute=null] A minute
     * @param  {string}   [second=null] A second
     * @returns {string}                 A SHA256 hash key
     */
    hash(cb, mode, hour = null, minute = null, second = null) {
        const fullStack = stackTrace.get();
        const filenamesConstant = (fullStack.length > 3) ? fullStack[3].getFileName() + fullStack[2].getFileName() : "";
        return sha256(cb.toString() + filenamesConstant + mode + hour + minute + second);
    }

    /**
     * Check if the element is already registered
     *
     * @param  {string} hash A registered element hash
     * @returns {int}      The index of the element in array. If not found, returns -1
     */
    elementForHash(hash) {
        let found = -1;
        let i = 0;
        this.registeredElements.forEach((el) => {
            if (el.hash === hash) {
                found = i;
            }
            i++;
        });

        return found;
    }

    /**
     * Register an timer element
     *
     * @param  {Function} cb            A callback triggered when conditions are reached (context will be set back as parameter). Example : `(self) => {}`
     * @param  {Object} context            The context to exectue the callback
     * @param  {int}   mode          Mode (enum) : `EVERY_SECONDS`, `EVERY_MINUTES`, `EVERY_HOURS`, `EVERY_DAYS` or `CUSTOM`
     * @param  {string}   [hour=null]   The hour value. `*` for all
     * @param  {string}   [minute=null] The minute value. `*` for all
     * @param  {string}   [second=null] The second value. `*` for all
     * @param  {string}   [key=null] A register key (optional)
     */
    register(cb, context, mode, hour = null, minute = null, second = null, key = null) {
        const obj = this.convertMode({
            hash: key ? key : this.hash(cb, mode, hour, minute, second),
            cb: cb,
            context: context,
            mode: mode,
            hour: hour,
            minute: minute,
            second:second
        });

        const index = this.elementForHash(obj.hash);
        if (index === -1) {
            this.registeredElements.push(obj);
        } else {
            Logger.warn("Element already registered");
        }
    }

    /**
     * Unegister an timer element
     *
     * @param  {Function} cb            A callback triggered when conditions are reached (context will be set back as parameter). Example : `(self) => {}`
     * @param  {int}   mode          Mode (enum) : `EVERY_SECONDS`, `EVERY_MINUTES`, `EVERY_HOURS`, `EVERY_DAYS` or `CUSTOM`
     * @param  {string}   [hour=null]   The hour value. `*` for all
     * @param  {string}   [minute=null] The minute value. `*` for all
     * @param  {string}   [second=null] The second value. `*` for all
     * @param  {string}   [key=null] A register key (optional)
     */
    unregister(cb, mode, hour = null, minute = null, second = null, key = null) {
        const obj = this.convertMode({
            hash: key ? key : this.hash(cb, mode, hour, minute, second),
            cb: cb,
            context: null,
            mode: mode,
            hour: hour,
            minute: minute,
            second:second
        });

        const index = this.elementForHash(obj.hash);
        if (index === -1) {
            Logger.verbose("Element not found");
        } else {
            this.registeredElements.splice(index ,1);
        }
    }

    /**
     * Convert values fro menum to valid hour, minute and seconds
     *
     * @param  {Object} obj  A TimerEvent object
     * @returns {Object}      A converted timerEvent object
     */
    convertMode(obj) {
        switch (obj.mode) {
        case EVERY_SECONDS:
            obj.second = "*";
            obj.minute = "*";
            obj.hour = "*";
            break;
        case EVERY_MINUTES:
            obj.second = 0;
            obj.minute = "*";
            obj.hour = "*";
            break;
        case EVERY_HOURS:
            obj.second = Math.floor(Math.random() * 59) + 0; // Sleek seconds for day processing
            obj.minute = 0;
            obj.hour = "*";
            break;
        case EVERY_HOURS_INACCURATE:
            obj.second = Math.floor(Math.random() * 59) + 0; // Sleek seconds for day processing
            obj.minute = Math.floor(Math.random() * 59) + 0;
            obj.hour = "*";
            break;
        case EVERY_DAYS:
            obj.second = 0;
            obj.minute = Math.floor(Math.random() * 58) + 1; // Sleek minutes for day processing
            obj.hour = Math.floor(Math.random() * 5) + 0; // Sleek hours for day processing
            break;
        case EVERY_FIVE_MINUTES:
            obj.second = 0;
            obj.minute = "*/5";
            obj.hour = "*";
            break;
        case EVERY_FIFTEEN_MINUTES:
            obj.second = 0;
            obj.minute = "*/15";
            obj.hour = "*";
            break;
        case EVERY_THIRTY_MINUTES:
            obj.second = 0;
            obj.minute = "*/30";
            obj.hour = "*";
            break;
        }

        return obj;
    }

    /**
     * Called when services starts, every seconds and trigger time vents
     *
     * @param  {TimerEventService} self Current timer event service reference (context)
     */
    timeEvent(self) {
        const dt = new Date();
        const nowSeconds = dt.getSeconds();
        const nowMinutes = dt.getMinutes();
        const nowHours = dt.getHours();
        self.registeredElements.forEach((registeredEl) => {
            let seconds = registeredEl.second;
            let minutes = registeredEl.minute;
            let hours = registeredEl.hour;

            if (parseInt(seconds) === nowSeconds || seconds === "*" || (String(seconds).indexOf("/") > 0 && nowSeconds % parseInt(seconds.split("/")[1]) == 0)) {
                if (parseInt(minutes) === nowMinutes || minutes === "*" || (String(minutes).indexOf("/") > 0 && nowMinutes % parseInt(minutes.split("/")[1]) == 0)) {
                    if (parseInt(hours) === nowHours || hours === "*" || (String(hours).indexOf("/") > 0 && nowHours % parseInt(hours.split("/")[1]) == 0)) {
                        try {
                            // Set timeout generate in a new thread
                            setTimeout(() => {
                                registeredEl.cb(registeredEl.context, nowHours, nowMinutes, nowSeconds);
                            }, 1);
                        } catch(e) {
                            Logger.err(e.message);
                        }
                    }
                }
            }
        });
    }
}

module.exports = {class:TimeEventService,
    EVERY_SECONDS:EVERY_SECONDS,
    EVERY_MINUTES:EVERY_MINUTES,
    EVERY_HOURS:EVERY_HOURS,
    EVERY_FIVE_MINUTES:EVERY_FIVE_MINUTES,
    EVERY_FIFTEEN_MINUTES:EVERY_FIFTEEN_MINUTES,
    EVERY_THIRTY_MINUTES:EVERY_THIRTY_MINUTES,
    EVERY_HOURS_INACCURATE:EVERY_HOURS_INACCURATE,
    EVERY_DAYS:EVERY_DAYS,
    CUSTOM:CUSTOM
};
