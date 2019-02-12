"use strict";

const THEME_GET = ":/theme/get/";
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");

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

        this.webServices.registerAPI(this, WebServices.GET, THEME_GET, Authentication.AUTH_NO_LEVEL);
    }

    /**
     * Retrieve the theme colors
     *
     * @returns {Object} Colors
     */
    getColors() {
        return  {
            primaryColor:"#617D8A",
            secondaryColor:"#344C70",
            tertiaryColor:"#99BD47",
            darkenColor: "#344C70",
            clearColor:"#EEEEEE",
            onColor:"#50AE55",
            offColor:"#F1453D",
            tilesSpacing: 1
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
                resolve(new APIResponse.class(true, self.getColors()));
            });
        }
    }

}

module.exports = {class:ThemeManager};
