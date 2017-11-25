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
        const iconsLabels = [];
        const list = Icons.class.list();
        const raw = Icons.class.raw();

        Object.keys(list).forEach((key) => {
            icons.push(list[key]);
            iconsLabels.push((key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()).split("_").join(" ").split("-").join(" "));
        });

        formManager.register(IconForm.class, icons, iconsLabels);
    }
}

module.exports = {class:IconFormManager};
