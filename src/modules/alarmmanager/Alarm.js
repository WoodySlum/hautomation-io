"use strict";

/**
 * This class is an Alarm POJO
 * @class
 */
class Alarm {
    /**
     * Constructor
     *
     * @param  {boolean} [enabled=false] True if alarm is enabled, else false
     * @returns {Alarm}                 The instance
     */
    constructor(enabled = false) {
        this.enabled = enabled;
    }

    /**
     * Transform json raw object to instance
     *
     * @param  {Object} data JSON object data
     * @returns {Alarm} A User instance
     */
    json(data) {
        return new Alarm(data.enabled);
    }
}

module.exports = {class:Alarm};
