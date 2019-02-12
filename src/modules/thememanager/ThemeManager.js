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
    constructor(appConfiguration, webService) {
        this.appConfiguration = appConfiguration;
        this.webServices = webService;

        this.webServices.registerAPI(this, WebServices.GET, THEME_GET, Authentication.AUTH_NO_LEVEL);
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
            darkenColor: "#343a40",
            clearColor:"#FFFFFF",
            onColor:"#99BD47",
            offColor:"#bdc2c1"
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
