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
     * @param  {string} id            An identifier
     */
    register(cb, id = null) {
        PrivateProperties.oprivate(this).radioManager.register(cb, id);
    }

    /**
     * Unegister an timer element
     *
     * @param  {Function} cb             A callback triggered when radio information is received. Example : `(radioObj) => {}`
     * @param  {string} id            An identifier
     */
    unregister(cb, id = null) {
        PrivateProperties.oprivate(this).radioManager.unregister(cb, id);
    }

    /**
     * Compare a `RadioScenarioForm` object and a standard received `RadioObject`
     *
     * @param  {RadioScenarioForm} radioFormObject The radio scenario form object
     * @param  {Object} radioObject     A standard radio object
     * @returns {boolean}                 `true` if objects matches, `false` otherwise
     */
    compareFormObject(radioFormObject, radioObject) {
        return PrivateProperties.oprivate(this).radioManager.compareFormObject(radioFormObject, radioObject);
    }

    /**
     * Get last received radio informations
     *
     * @param  {Function} cb               A callback `cb(radioObjects) => {}`
     * @param  {number}   [nbElements=100] Number of elements
     */
    getLastReceivedRadioInformations(cb, nbElements = 100) {
        PrivateProperties.oprivate(this).radioManager.getLastReceivedRadioInformations(cb, nbElements);
    }

    /**
     * Force refresh protocols
     */
    refreshProtocols() {
        PrivateProperties.oprivate(this).radioManager.getProtocols();
    }
}

module.exports = {class:RadioAPI};
