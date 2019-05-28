"use strict";
const PrivateProperties = require("./../PrivateProperties");

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
}

module.exports = {class:ThemeAPI};
