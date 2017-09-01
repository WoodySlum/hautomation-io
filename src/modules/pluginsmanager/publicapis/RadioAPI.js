"use strict";
const PrivateProperties = require("./../PrivateProperties");

/**
 * Public API for radio events
 * @class
 */
class RadioAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {RadioManager} radioManager The radio manager
    //  * @returns {RadioAPI}             The instance
    //  */
    constructor(radioManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).radioManager = radioManager;
    }
    /* eslint-enable */

    /**
     * Register for radio events
     *
     * @param  {Function} cb            A callback triggered when radio information is received. Example : `(radioObj) => {}`
     */
    register(cb) {
        PrivateProperties.oprivate(this).radioManager.register(cb);
    }

    /**
     * Unegister an timer element
     *
     * @param  {Function} cb             A callback triggered when radio information is received. Example : `(radioObj) => {}`
     */
    unregister(cb) {
        PrivateProperties.oprivate(this).radioManager.unregister(cb);
    }

}

module.exports = {class:RadioAPI};
