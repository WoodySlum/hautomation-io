/* eslint-disable */
"use strict";
const IconForm = require("./IconForm");
const FormManager = require("./../modules/formmanager/FormManager");
const Icons = require("./../../res/icons/config.json");

/**
 * This class allows to generate a form part with an icon select box
 * @class
 */
class IconFormManager {
    /**
     * Constructor
     *
     * @param  {FormManager} formManager A form manager
     * @returns {IconFormManager}             The instance
     */
    constructor(formManager) {
        const icons = [];
        Icons.glyphs.forEach((glyph) => {
            icons.push(glyph.code);
        });
        formManager.register(IconForm.class, icons);
    }
}

module.exports = {class:IconFormManager};
