"use strict";
const PrivateProperties = require("./../PrivateProperties");
const Cleaner = require("./../../../utils/Cleaner");
const SchedulerService = require("./../../../services/schedulerservice/SchedulerService");

/**
 * Public API for time events
 * @class
 */
class SchedulerAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {SchedulerService} schedulerService The scheduler service
    //  * @return {SchedulerAPI}             The instance
    //  */
    constructor(schedulerService) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).schedulerService = schedulerService;
    }
    /* eslint-enable */

    /**
     * Register a scheduler callback
     *
     * @param  {string}   id       An identifier (must be unique)
     * @param  {Function} callback A callback with an object in parameter : `(data) => {}``
     */
    register(id, callback) {
        PrivateProperties.oprivate(this).schedulerService.register(id, callback);
    }

    /**
     * Unregister a scheduler callback
     *
     * @param  {string}   id       An identifier (must be unique)
     */
    unregister(id) {
        PrivateProperties.oprivate(this).schedulerService.unregister(id);
    }

    /**
     * Schedule an operation for a registered callback
     *
     * @param  {string}   id       An identifier (must be unique)
     * @param  {timestamp} timestamp      A timestamp or a constant : `IN_A_MINUTE`, `IN_FIVE_MINUTES`, `IN_TEN_MINUTES`, `IN_THIRTY_MINUTES`, `IN_A_HOUR`, `IN_TWELVE_HOUR`, `IN_A_DAY`
     * @param  {Object} [data={}] A data passed to callback when triggered
     */
    schedule(id, timestamp, data = {}) {
        PrivateProperties.oprivate(this).schedulerService.schedule(id, timestamp, data);
    }

    /**
     * Expose a list of constants : `IN_A_MINUTE`, `IN_FIVE_MINUTES`, `IN_TEN_MINUTES`, `IN_THIRTY_MINUTES`, `IN_A_HOUR`, `IN_TWELVE_HOUR`, `IN_A_DAY`
     *
     * @returns {Object} Constants
     */
    constants() {
        return Cleaner.class.exportConstants(SchedulerService);
    }

}

module.exports = {class:SchedulerAPI};
