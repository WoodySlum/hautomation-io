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
     * @returns {Object} Colors
     */
    getColors() {
        return PrivateProperties.oprivate(this).themeManager.getColors();
    }
}

module.exports = {class:ThemeAPI};
