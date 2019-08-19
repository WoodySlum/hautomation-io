"use strict";
const PrivateProperties = require("./../PrivateProperties");
const Cleaner = require("./../../../utils/Cleaner");
const ThemeManager = require("./../../thememanager/ThemeManager");

/**
 * Public API for theme, colors
 * @class
 */
class ThemeAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {ThemeManager} themeManager The theme manager
    //  * @return {ThemeAPI}             The instance
    //  */
    constructor(themeManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).themeManager = themeManager;
    }
    /* eslint-enable */

    /**
     * Retrieve the theme colors
     *
     * @param  {string} [username=null] A username, for customization
     * @returns {Object} Colors
     */
    getColors(username = null) {
        return PrivateProperties.oprivate(this).themeManager.getColors(username);
    }

    /**
     * Access to web services constants
     *
     * @returns {Object} The constants
     */
    constants() {
        return Cleaner.class.exportConstants(ThemeManager);
    }
}

module.exports = {class:ThemeAPI};
