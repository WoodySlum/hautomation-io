"use strict";
const PrivateProperties = require("./../PrivateProperties");

/**
 * Public API for core
 * @class
 */
class CoreAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {EventEmitter} eventBus Core event bus
    //  * @returns {CoreAPI}             The instance
    //  */
    constructor(eventBus) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).eventBus = eventBus;
    }
    /* eslint-enable */


    /**
     * Dispatch an event through all registered modules
     *
     * @param  {string} name        An event name
     * @param  {Object} [data=null] Some data
     */
    dispatchEvent(name, data = null) {
        // Dispatch event
        if (PrivateProperties.oprivate(this).eventBus) {
            PrivateProperties.oprivate(this).eventBus.emit(name, data);
        }
    }

    /**
     * Register to a specific event
     *
     * @param  {string}   name The event's name
     * @param  {Function} cb   A callback `(data) => {}``
     */
    registerEvent(name, cb) {
        if (PrivateProperties.oprivate(this).eventBus) {
            PrivateProperties.oprivate(this).eventBus.on(name, cb);
        }
    }

}

module.exports = {class:CoreAPI};
