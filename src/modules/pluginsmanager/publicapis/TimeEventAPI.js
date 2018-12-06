"use strict";
const PrivateProperties = require("./../PrivateProperties");
const Cleaner = require("./../../../utils/Cleaner");
const TimeEventService = require("./../../../services/timeeventservice/TimeEventService");

/**
 * Public API for time events
 * @class
 */
class TimeEventAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {TimerEventService} timeEventService The time event service
    //  * @return {TimeEventAPI}             The instance
    //  */
    constructor(timeEventService) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).timeEventService = timeEventService;
    }
    /* eslint-enable */

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
        PrivateProperties.oprivate(this).timeEventService.register(cb, context, mode, hour, minute, second, key);
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
        PrivateProperties.oprivate(this).timeEventService.unregister(cb, mode, hour, minute, second, key);
    }

    /**
     * Expose a list of constants : `EVERY_SECONDS`, `EVERY_MINUTES`, `EVERY_HOURS`, `EVERY_DAYS` or `CUSTOM`
     *
     * @returns {Object} Constants
     */
    constants() {
        return Cleaner.class.exportConstants(TimeEventService);
    }

}

module.exports = {class:TimeEventAPI};
