"use strict";
const PrivateProperties = require("./../PrivateProperties");

/**
 * Public API for ai
 * @class
 */
class AiAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {string} identifier The plugin identifier
    //  * @param  {aiManager} alarmManager The ai manager instance
    //  * @returns {AiAPI}             The instance
    //  */
    constructor(identifier, aiManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).identifier = identifier;
        PrivateProperties.oprivate(this).aiManager = aiManager;
    }

    /**
     * Register
     *
     * @param  {Function} [tokenizer=null]    A tokenizer function. If not provided, default tokenizer.
     */
    register(tokenizer = null) {
        PrivateProperties.oprivate(this).aiManager.register(PrivateProperties.oprivate(this).identifier, tokenizer);
    }

    /**
     * Learn data to ai engine
     *
     * @param  {string|Array} data    The data
     * @param  {string} classification    The classification
     *
     * @returns {Promise} The promise
     */
    learn(data, classification) {
        return PrivateProperties.oprivate(this).aiManager.learn(PrivateProperties.oprivate(this).identifier, data, classification);
    }

    /**
     * Learn time data to ai engine
     *
     * @param  {Array} data    The data
     * @param  {string} classification    The classification
     *
     * @returns {Promise} The promise
     */
    learnWithTime(data, classification) {
        return PrivateProperties.oprivate(this).aiManager.learnWithTime(PrivateProperties.oprivate(this).identifier, data, classification);
    }

    /**
     * Guess the classification
     *
     * @param  {string|Array} data    The data
     *
     * @returns {Promise} The promise with the classification
     */
    guess(data) {
        return PrivateProperties.oprivate(this).aiManager.guess(PrivateProperties.oprivate(this).identifier, data);
    }

    /**
     * Guess time data to ai engine
     *
     * @param  {Array} data    The data
     * @param  {number} timestamp    The desired timestamp
     *
     * @returns {Promise} The promise
     */
    guessWithTime(data, timestamp) {
        return PrivateProperties.oprivate(this).aiManager.guessWithTime(PrivateProperties.oprivate(this).identifier, data, timestamp);
    }
}

module.exports = {class:AiAPI};
