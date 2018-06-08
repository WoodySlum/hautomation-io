"use strict";
const PrivateProperties = require("./../PrivateProperties");
const Cleaner = require("./../../../utils/Cleaner");
const DeviceManager = require("./../../devicemanager/DeviceManager");

/**
 * Public API for devices
 * @class
 */
class DeviceAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {DeviceManager} deviceManager The device manager
    //  * @returns {DeviceAPI}             The instance
    //  */
    constructor(deviceManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).deviceManager = deviceManager;
    }
    /* eslint-enable */

    /**
     * Return the list of devices
     *
     * @returns {Array} The list of devices
     */
    getDevices() {
        return PrivateProperties.oprivate(this).deviceManager.getDevices();
    }

    /**
     * Switch a device radio status
     *
     * @param  {number} id            A device identifier
     * @param  {string} [status=null] A status  (`on`, `off` or radio status)
     */
    switchDevice(id, status = null) {
        PrivateProperties.oprivate(this).deviceManager.switchDevice(id, status);
    }

    /**
     * Expose a list of constants (status)
     *
     * @returns {Object} Constants
     */
    constants() {
        return Cleaner.class.exportConstants(DeviceManager);
    }

    /**
     * Return a status of a device
     *
     * @returns {boolean} Status of the device
     */
    getDeviceStatus(id) {
        return PrivateProperties.oprivate(this).deviceManager.getDeviceStatus(id);
    }
}

module.exports = {class:DeviceAPI};
