/* eslint-disable */
"use strict";
const IconForm = require("./IconForm");
const FormManager = require("./../modules/formmanager/FormManager");
const Icons = require("../utils/Icons");

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
        const list = Icons.class.list();
        Object.keys(list).forEach((key) => {
            icons.push(list[key]);
        });
        formManager.register(IconForm.class, icons);
    }
}

module.exports = {class:IconFormManager};
