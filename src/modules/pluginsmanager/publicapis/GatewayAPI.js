"use strict";
const PrivateProperties = require("./../PrivateProperties");

/**
 * Public API for gateway
 * @class
 */
class GatewayAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {GatewayManager} gatewayManager The gateway manager instance
    //  * @returns {GatewayAPI}             The instance
    //  */
    constructor(gatewayManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).gatewayManager = gatewayManager;
    }
    /* eslint-enable */

    /**
     * Get full smarties URL
     * 
     * @returns {string} The URL
     */
    getDistantUrl() {
        return PrivateProperties.oprivate(this).gatewayManager.getDistantUrl();
    }

    /**
     * Get full smarties API URL
     *
     * @returns {string} The URL
     */
    getDistantApiUrl() {
        return PrivateProperties.oprivate(this).gatewayManager.getDistantApiUrl();
    }
}

module.exports = {class:GatewayAPI};
