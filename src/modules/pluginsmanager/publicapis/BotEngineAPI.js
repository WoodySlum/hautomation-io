"use strict";
const PrivateProperties = require("./../PrivateProperties");

/**
 * Public API for bot engine
 * @class
 */
class BotEngineAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {BotEngine} installationManager The installation manager instance
    //  * @returns {BotEngineAPI}             The instance
    //  */
    constructor(botEngine) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).botEngine = botEngine;
    }
    /* eslint-enable */

    /**
     * Play a sound
     *
     * @param  {string} soundPath The sound's file path
     */
    playSound(soundPath) {
        PrivateProperties.oprivate(this).botEngine.playSound(soundPath);
    }

    /**
     * Speech some text
     *
     * @param  {string} text A text
     */
    textToSpeech(text) {
        PrivateProperties.oprivate(this).botEngine.textToSpeech(text);
    }

    /**
     * Register a bot action
     *
     * @param  {string}   actionKey The action key
     * @param  {Function} cb        The callback to implement : `(action, value, type, confidence, sender, cb) => {cb("Job done !");}`
     */
    registerBotAction(actionKey, cb) {
        PrivateProperties.oprivate(this).botEngine.registerBotAction(actionKey, cb);
    }

    /**
     * Unregister a bot action
     *
     * @param  {string}   actionKey The action key
     */
    unregisterBotAction(actionKey) {
        PrivateProperties.oprivate(this).botEngine.unregisterBotAction(actionKey);
    }
}

module.exports = {class:BotEngineAPI};
