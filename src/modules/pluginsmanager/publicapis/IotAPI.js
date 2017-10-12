"use strict";
const PrivateProperties = require("./../PrivateProperties");
const pathl = require("path");
const callsite = require("callsite");

/**
 * Public API for iot
 * @class
 */
class IotAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {IotManager} iotManager The IoT manager instance
    //  * @returns {AlarmAPI}             The instance
    //  */
    constructor(iotManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).iotManager = iotManager;
        this.iotApp = null;
    }

    registerLib(path, id, form = null, ...inject) {
        const callerPath = pathl.dirname(callsite()[1].getFileName());
        PrivateProperties.oprivate(this).iotManager.registerLib(callerPath + "/" + path, id, form, ...inject);
    }

    registerApp(path, id, name, version, platform, board, framework, form = null, ...inject) {
        const callerPath = pathl.dirname(callsite()[1].getFileName());
        PrivateProperties.oprivate(this).iotManager.registerApp(callerPath + "/" + path, id, name, version, platform, board, framework, form, ...inject);
        this.iotApp = id;
    }

    iotAppExists(id) {
        return PrivateProperties.oprivate(this).iotManager.iotAppExists(id);
    }
}

module.exports = {class:IotAPI};
