"use strict";
const PrivateProperties = require("./../PrivateProperties");

/**
 * Public API for alarm
 * @class
 */
class AlarmAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {AlarmManager} alarmManager The alarm manager instance
    //  * @returns {AlarmAPI}             The instance
    //  */
    constructor(alarmManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).alarmManager = alarmManager;
    }
    /* eslint-enable */

    /**
     * Get alarm state
     *
     * @returns {boolean} True if alarm is enabled, false otherwise
     */
    alarmStatus() {
        return PrivateProperties.oprivate(this).alarmManager.alarmStatus();
    }

    /**
     * Enable alarm
     */
    enableAlarm() {
        PrivateProperties.oprivate(this).alarmManager.enableAlarm();
    }

    /**
     * Disable alarm
     */
    disableAlarm() {
        PrivateProperties.oprivate(this).alarmManager.disableAlarm();
    }
}

module.exports = {class:AlarmAPI};
