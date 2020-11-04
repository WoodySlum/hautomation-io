"use strict";

const THEME_GET = ":/theme/get/";
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");
const Logger = require("./../../logger/Logger");
const Icons = require("./../../utils/Icons");

/**
 * This class generates dashboard
 * @class
 */
class ThemeManager {
    /**
     * Constructor
     *
     * @param  {AppConfiguration} appConfiguration Configuration
     * @param  {WebServices} webServices    The web services
     * @returns {ThemeManager}                  The instance
     */
    constructor(appConfiguration, webServices) {
        this.appConfiguration = appConfiguration;
        this.webServices = webServices;
        this.userThemes = {};

        this.webServices.registerAPI(this, WebServices.GET, THEME_GET, Authentication.AUTH_NO_LEVEL);
    }

    /**
     * Check if the color is in right format
     *
     * @param  {string} color A color
     * @returns {boolean}       `true` if color is ok, `false` otherwise
     */
    checkColorFormat(color) {
        if (/^#((0x){0,1}|#{0,1})([0-9A-F]{8}|[0-9A-F]{6})$/.test(color)) {
            return true;
        } else {
            Logger.warn("Invalid color for theme : " + color);
            return false;
        }
    }

    /**
     * Set a specific theme for a user
     *
     * @param {string} username A username
     * @param {Object} theme    A theme
     */
    setThemeForUser(username, theme) {
        if (username && theme) {
            Logger.info("Set theme for user " + username);
            this.userThemes[username] = {};
            if (theme.primaryColor && this.checkColorFormat(theme.primaryColor)) {

                this.userThemes[username].primaryColor = theme.primaryColor;
            }

            if (theme.secondaryColor && this.checkColorFormat(theme.secondaryColor)) {

                this.userThemes[username].secondaryColor = theme.secondaryColor;
            }

            if (theme.tertiaryColor && this.checkColorFormat(theme.tertiaryColor)) {

                this.userThemes[username].tertiaryColor = theme.tertiaryColor;
            }

            if (theme.darkenColor && this.checkColorFormat(theme.darkenColor)) {

                this.userThemes[username].darkenColor = theme.darkenColor;
            }

            if (theme.clearColor && this.checkColorFormat(theme.clearColor)) {

                this.userThemes[username].clearColor = theme.clearColor;
            }

            if (theme.onColor && this.checkColorFormat(theme.onColor)) {

                this.userThemes[username].onColor = theme.onColor;
            }

            if (theme.offColor && this.checkColorFormat(theme.offColor)) {

                this.userThemes[username].offColor = theme.offColor;
            }

            if (typeof theme.tilesSpacing !== "undefined") {

                this.userThemes[username].tilesSpacing = parseInt(theme.tilesSpacing);
            }
        }
    }

    /**
     * Retrieve the theme colors
     *
     * @param  {string} [username=null] A username
     * @returns {Object} Colors
     */
    getColors(username = null) {
        const customizedTheme = this.userThemes[username] ? this.userThemes[username] : {};

        return {
            primaryColor:(customizedTheme.primaryColor ? customizedTheme.primaryColor : "#70A9A1"),
            secondaryColor:(customizedTheme.secondaryColor ? customizedTheme.secondaryColor : "#40798C"),
            tertiaryColor:(customizedTheme.tertiaryColor ? customizedTheme.tertiaryColor : "#9EC1A3"),
            darkenColor:(customizedTheme.darkenColor ? customizedTheme.darkenColor : "#1F363D"),
            clearColor:(customizedTheme.clearColor ? customizedTheme.clearColor : "#E4EEDD"),
            onColor:(customizedTheme.onColor ? customizedTheme.onColor : "#77A310"),
            offColor:(customizedTheme.offColor ? customizedTheme.offColor : "#D04B48"),
            tilesSpacing:(typeof customizedTheme.tilesSpacing !== "undefined" ? customizedTheme.tilesSpacing : 0),
            icons:Icons.iconsSvg
        };
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        const self = this;
        if (apiRequest.route === THEME_GET) {
            return new Promise((resolve) => {
                resolve(new APIResponse.class(true, self.getColors(apiRequest.authenticationData.username)));
            });
        }
    }

}

module.exports = {class:ThemeManager, PRIMARY_COLOR_KEY:"primaryColor", SECONDARY_COLOR_KEY:"secondaryColor", TERTIARY_COLOR_KEY:"tertiaryColor", DARK_COLOR_KEY:"darkColor", CLEAR_COLOR_KEY:"clearColor", ON_COLOR_KEY:"onColor", OFF_COLOR_KEY:"offColor", TILES_SPACING_KEY:"tilesSpacing"};
