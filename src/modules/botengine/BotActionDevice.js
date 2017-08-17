"use strict";
const Logger = require("./../../logger/Logger");
const BotAction = require("./BotAction");

/**
 * This class is the device bot action
 * @class
 */
class BotActionDevice extends BotAction.class {
    /**
     * Constructor
     *
     * @param  {TranslateManager} translateManager The translation manager
     * @returns {BotActionDevice} The instance
     */
    constructor(translateManager) {
        super(translateManager);
    }


    execute(user, action, value) {
        return this.translateManager.t("bot.misunderstand");
    }
}

module.exports = {class:BotActionDevice};
