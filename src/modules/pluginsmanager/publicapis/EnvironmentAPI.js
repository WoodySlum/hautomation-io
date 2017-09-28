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
}

module.exports = {class:EnvironmentAPI};
