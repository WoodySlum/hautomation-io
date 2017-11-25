"use strict";
const PrivateProperties = require("./../PrivateProperties");

/**
 * Public API for home environement
 * @class
 */
class EnvironmentAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {EnvironmentManager} environmentManager The environment manager instance
    //  * @returns {EnvironmentAPI}             The instance
    //  */
    constructor(environmentManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).environmentManager = environmentManager;
    }
    /* eslint-enable */

    /**
     * Return the home's coordinates
     *
     * @returns {Object} The coordinates
     */
    getCoordinates() {
        return PrivateProperties.oprivate(this).environmentManager.getCoordinates();
    }

    /**
     * Set day
     */
    setDay() {
        PrivateProperties.oprivate(this).environmentManager.setDay();
    }

    /**
     * Set night
     */
    setNight() {
        PrivateProperties.oprivate(this).environmentManager.setNight();
    }

    /**
     * Is it night ?
     *
     * @returns {boolean} `true` if night mode, otherwise `false`
     */
    isNight() {
        return PrivateProperties.oprivate(this).environmentManager.isNight();
    }

    /**
     * Register for day/night notifications
     *
     * @param  {Function} cb            A callback triggered when day/night information is received. Example : `(isNight) => {}`
     * @param  {string} id            An identifier
     */
    registerDayNightNotifications(cb, id = null) {
        PrivateProperties.oprivate(this).environmentManager.registerDayNightNotifications(cb, id);
    }

    /**
     * Unegister for day/night notifications
     *
     * @param  {Function} cb             A callback triggered when day/night information is received. Example : `(isNight) => {}`
     * @param  {string} id            An identifier
     */
    unregisterDayNightNotifications(cb, id = null) {
        PrivateProperties.oprivate(this).environmentManager.unregisterDayNightNotifications(cb, id);
    }

    /**
     * Get the local API Url
     *
     * @returns {string} The local API url (e.g. : http://192.168.2.34:8100/api/)
     */
    getLocalAPIUrl() {
        return PrivateProperties.oprivate(this).environmentManager.getLocalAPIUrl();
    }
}

module.exports = {class:EnvironmentAPI};
