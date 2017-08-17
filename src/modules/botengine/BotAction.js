"use strict";
const Logger = require("./../../logger/Logger");

/**
 * This class is the superclass for bot action
 * @class
 */
class BotAction {
    /**
     * Constructor
     *
     * @param  {TranslateManager} translateManager The translation manager
     * @returns {BotAction} The instance
     */
    constructor(translateManager) {
        this.translateManager = translateManager;
    }

    /**
     * Execute the action
     *
     * @param  {UserForm} user   A user
     * @param  {string} action An action
     * @param  {string} value  The value
     * @returns {string}        The response
     */
    execute(user, action, value) {
        return this.translateManager.t("bot.misunderstand");
    }
}

module.exports = {class:BotAction};
