"use strict";

/**
 * This class generates dashboard
 * @class
 */
class ThemeManager {
    /**
     * Constructor
     *
     * @param  {AppConfiguration} appConfiguration Configuration
     * @returns {ThemeManager}                  The instance
     */
    constructor(appConfiguration) {
        this.appConfiguration = appConfiguration;
    }

    /**
     * Retrieve the theme colors
     *
     * @returns {Object} Colors
     */
    getColors() {
        return  {
            primaryColor:"#ABB0AF",
            secondaryColor:"#bdc2c1",
            tertiaryColor:"#99BD47",
            clearColor:"#FFFFFF",
            onColor:"#99BD47",
            offColor:"#bdc2c1"
        };
    }

}

module.exports = {class:ThemeManager};
