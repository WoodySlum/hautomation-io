"use strict";
const Logger = require("./../../logger/Logger");
const Authentication = require("./../authentication/Authentication");
const FormConfiguration = require("./../formconfiguration/FormConfiguration");
const UserForm = require("./UserForm");
const ImageUtils = require("./../../utils/ImageUtils");
const Tile = require("./../dashboardmanager/Tile");
const WebServices = require("./../../services/webservices/WebServices");
const APIResponse = require("./../../services/webservices/APIResponse");
const GeoUtils = require("./../../utils/GeoUtils");
const UserScenarioForm = require("./UserScenarioForm");
const UserScenarioTriggerForm = require("./UserScenarioTriggerForm");
const sha256 = require("sha256");

const CONF_KEY = "users";
const ERROR_USER_NOT_FOUND = "ERROR_USER_NOT_FOUND";

const ROUTE_USER_ZONE = ":/user/zone/set/";
const ROUTE_USER_LOCATION = ":/user/location/set/";
const ROUTE_USER_SETTINGS = ":/user/settings/get/";

const USER_COMPARE_CONFIDENCE = 0.31;

/**
* This class allows to manage users (create, delete, search, ...)
* @class
*/
class UserManager {
    /**
    * Constructor
    *
    * @param  {ConfManager} confManager A configuration manager needed for persistence
    * @param  {FormManager} formManager  A form manager
    * @param  {WebServices} webServices  The web services
    * @param  {DashboardManager} dashboardManager  The dashboard manager
    * @param  {AppConfiguration} appConfiguration The app configuration object
    * @param  {ScenarioManager} scenarioManager  The scenario manager
    * @param  {EnvironmentManager} environmentManager  The environment manager
    * @param  {TranslateManager} translateManager  The translate manager
    * @param {ThemeManager} themeManager       The theme manager
    * @returns {UserManager} The instance
    */
    constructor(confManager, formManager, webServices, dashboardManager, appConfiguration, scenarioManager, environmentManager, translateManager, themeManager) {
        this.formConfiguration = new FormConfiguration.class(confManager, formManager, webServices, CONF_KEY, true, UserForm.class);
        this.confManager = confManager;
        this.dashboardManager = dashboardManager;
        this.webServices = webServices;
        this.appConfiguration = appConfiguration;
        this.scenarioManager = scenarioManager;
        this.environmentManager = environmentManager;
        this.botEngine = null;
        this.translateManager = translateManager;
        this.themeManager = themeManager;
        this.updateTile();
        this.registeredHomeNotifications = {};
        this.dashboardManager.setUserManager(this);

        this.webServices.registerAPI(this, WebServices.POST, ROUTE_USER_ZONE + "[status]/", Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, ROUTE_USER_LOCATION + "[longitude]/[latitude]/[radius*]/[speed*]/[timestamp*]/", Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, ROUTE_USER_SETTINGS, Authentication.AUTH_USAGE_LEVEL);
        this.formConfiguration.setUpdateCb(() => {
            this.setAllUsersTheme();
            this.updateTile();
            this.registerScenarioForms();
        });

        this.registerScenarioForms();
        this.formConfiguration.setSortFunction((a,b) => a.username.localeCompare(b.username));
        this.setAllUsersTheme();
    }

    /**
     * Register scenario forms
     */
    registerScenarioForms() {
        this.scenarioManager.register(UserScenarioForm.class, null, "user.scenario.form.mode.trigger", 200);
        const usernames = ["-"];
        const usernamesLabels = [this.translateManager.t("user.scenario.form.provided")];
        this.getUsers().forEach((user) => {
            usernames.push(user.username);
            usernamesLabels.push(user.name);
        });

        this.scenarioManager.registerWithInjection(UserScenarioTriggerForm.class, (scenario, additionalInfos) => {
            if (scenario && scenario.UserScenarioTriggerForm && scenario.UserScenarioTriggerForm.length > 0) {
                scenario.UserScenarioTriggerForm.forEach((userScenarioTriggerForm) => {
                    const user = this.getUser(userScenarioTriggerForm.username === "-" ? additionalInfos.username : userScenarioTriggerForm.username);
                    if (user) {
                        if (userScenarioTriggerForm.inorout === 1) {
                            this.setUserZone(user.username, true);
                        } else if (userScenarioTriggerForm.inorout === 2) {
                            this.setUserZone(user.username, false);
                        } else if (userScenarioTriggerForm.inorout === 3) {
                            this.setUserZone(user.username, !user.atHome);
                        }
                    } else {
                        Logger.err("Could not find user " + additionalInfos.username);
                    }
                });
            }
        }, "user.scenario.form.trigger.mode.trigger", 100, true, usernames, usernamesLabels);
    }

    /**
    * Update user tile
    */
    updateTile() {
        const pics = [];
        let foundPics = false;
        // Credits : Dreamstale / https://www.flaticon.com/premium-icon/group_694642
        const svg = "<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"	 viewBox=\"0 0 512 512\" style=\"enable-background:new 0 0 512 512;\" xml:space=\"preserve\"><g>	<g>		<path d=\"M437.76,195.421c14.561-14.261,23.04-33.742,23.04-54.621c0-42.346-34.45-76.8-76.8-76.8			c-13.992,0-27.758,3.846-39.825,11.125c-4.033,2.438-5.333,7.679-2.9,11.717c2.433,4.038,7.683,5.325,11.717,2.9			c9.408-5.675,20.125-8.675,31.008-8.675c32.933,0,59.733,26.796,59.733,59.733c0,20.283-10.158,38.979-27.208,50.037			c-14.317,9.392-32.467,12.1-49.042,7.379c-4.483-1.292-9.25,1.325-10.55,5.858c-1.292,4.533,1.333,9.254,5.867,10.55			c6.9,1.975,14.033,2.975,21.2,2.975c13.418,0,26.388-3.66,37.903-10.27c43.806,15.873,73.03,57.232,73.03,104.137v42.667h-77.812			c-6.044-56.996-41.902-106.872-94.205-130.555c16.644-16.946,26.95-40.138,26.95-65.711C349.867,106.108,307.758,64,256,64			c-51.758,0-93.867,42.108-93.867,93.867c0,25.581,10.312,48.78,26.965,65.728c-17.602,7.997-33.927,19.185-47.773,32.952			c-26.543,26.619-42.695,60.784-46.529,97.588H17.067v-42.667c0-29.55,11.542-57.412,32.467-78.425			c11.519-11.446,25.543-20.178,40.643-25.666C101.694,213.96,114.625,217.6,128,217.6c7.167,0,14.3-1,21.2-2.975			c4.533-1.296,7.158-6.017,5.867-10.55c-1.3-4.533-6.067-7.146-10.55-5.858c-16.567,4.729-34.708,2.025-49.083-7.4			c-17.008-11.038-27.167-29.733-27.167-50.017c0-32.937,26.8-59.733,59.733-59.733c10.883,0,21.6,3,31.008,8.675			c4.05,2.425,9.275,1.125,11.717-2.9c2.433-4.037,1.133-9.279-2.9-11.717C155.758,67.846,141.992,64,128,64			c-42.35,0-76.8,34.454-76.8,76.8c0,20.863,8.465,40.329,22.984,54.577c-13.533,6.291-26.032,14.976-36.717,25.59			C13.308,245.233,0,277.371,0,311.467v51.2c0,4.713,3.817,8.533,8.533,8.533h85.333v68.267c0,4.713,3.817,8.533,8.533,8.533h307.2			c4.717,0,8.533-3.821,8.533-8.533V371.2h85.333c4.717,0,8.533-3.821,8.533-8.533v-51.2			C512,261.012,482.678,216.128,437.76,195.421z M179.2,157.867c0-42.346,34.45-76.8,76.8-76.8c42.35,0,76.8,34.454,76.8,76.8			s-34.45,76.8-76.8,76.8C213.65,234.667,179.2,200.212,179.2,157.867z M401.067,430.933H110.933V371.2			c0-38.692,15.083-75.129,42.45-102.579c14.417-14.34,31.895-25.463,50.634-32.659c14.895,9.947,32.767,15.771,51.983,15.771			c19.248,0,37.151-5.841,52.06-15.818c55.778,21.431,93.007,75.205,93.007,135.285V430.933z\"/>	</g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>";

        this.getUsers().forEach((user) => {
            if (user.picture) {
                const pic = ImageUtils.class.sanitizeFormConfiguration(user.picture);
                if (pic) {
                    if (user.atHome) {
                        foundPics = true;
                        ImageUtils.class.resize(pic, (err, data) => {
                            if (!err) {
                                pics.push(data);
                                const uTile = new Tile.class(this.dashboardManager.themeManager, "users", Tile.TILE_PICTURES, svg, null, null, null, null, pics);
                                this.dashboardManager.registerTile(uTile);
                            } else {
                                Logger.err(err.message);
                            }
                        });
                    }
                }
            }
        });

        if (!foundPics) {
            const tile = new Tile.class(this.dashboardManager.themeManager, "users", Tile.TILE_PICTURES, svg, null, null, null, null, pics);
            this.dashboardManager.registerTile(tile);
        }
    }

    /**
    * Return a COPY of the user array
    *
    * @returns {[User]} An array of Users
    */
    getUsers() {
        return this.formConfiguration.getDataCopy();
    }

    /**
    * Get a theme for a specific user
    *
    * @param  {string} username The username
    * @returns {Object}   A theme
    */
    getTheme(username) {
        const user = this.getUser(username);
        if (user && user.theme && user.theme.length > 0) {
            const base64Array = user.theme.split("base64,");
            if (base64Array.length === 2) {
                const buf = Buffer.from(base64Array[1], "base64");
                const themeStr = buf.toString("ascii");
                try {
                    const theme = JSON.parse(themeStr);
                    return theme;
                } catch (e) {
                    Logger.err("Invalid JSON for theme. User : " + username);
                }
            } else {
                Logger.err("Invalid base64 for theme. User : " + username);
            }
        }

        return null;
    }

    /**
     * Set all users theme to theme manager
     */
    setAllUsersTheme() {
        this.getUsers().forEach((user) => {
            const theme = this.getTheme(user.username);
            this.themeManager.setThemeForUser(user.username, theme);
        });
    }

    /**
    * Get a user with username
    *
    * @param  {string} username The username
    * @returns {User}   A user, null if user does not exists
    */
    getUser(username) {
        let foundUser = null;
        this.formConfiguration.getDataCopy().forEach((user) => {
            if (user.username && username && user.username.toLowerCase() === username.toLowerCase()) {
                foundUser = user;
            }
        });
        return foundUser;
    }

    /**
    * Get the admin user
    *
    * @returns {User} The admin user, null if admin user is disabled
    */
    getAdminUser() {
        if (this.confManager.appConfiguration.admin.enable) {
            return new UserForm.class(0, this.confManager.appConfiguration.admin.username, this.confManager.appConfiguration.admin.password, Authentication.AUTH_MAX_LEVEL);
        }

        return null;
    }

    /**
    * Check if all users are at home
    *
    * @returns {boolean} True if everybody is at home, false otherwise
    */
    allUsersAtHome() {
        let allUsersAtHome = true;
        this.formConfiguration.getDataCopy().forEach((user) => {
            if (!user.atHome && user.level >= Authentication.AUTH_USAGE_LEVEL) {
                allUsersAtHome = false;
            }
        });

        return allUsersAtHome;
    }

    /**
    * Check if no users are at home
    *
    * @returns {boolean} True if nobody is at home, false otherwise
    */
    nobodyAtHome() {
        let nobodyAtHome = true;
        this.formConfiguration.getDataCopy().forEach((user) => {
            if (user.atHome && user.level >= Authentication.AUTH_USAGE_LEVEL) {
                nobodyAtHome = false;
            }
        });

        return nobodyAtHome;
    }

    /**
    * Check if a user is at home
    *
    * @returns {boolean} True if somebody is at home, false otherwise
    */
    somebodyAtHome() {
        let somebodyAtHome = false;
        this.formConfiguration.getDataCopy().forEach((user) => {
            if (user.atHome && user.level >= Authentication.AUTH_USAGE_LEVEL) {
                somebodyAtHome = true;
            }
        });

        return somebodyAtHome;
    }

    /**
    * Set user zone
    *
    * @param {string} username The username
    * @param {boolean} inZone True if user is in zone, false otherwise
    */
    setUserZone(username, inZone) {
        const self = this;
        let u = null;
        this.formConfiguration.getDataCopy().forEach((user) => {
            if (user.username === username) {
                u = user;
            }
        });

        if (u) {
            if (u.level >= Authentication.AUTH_USAGE_LEVEL) {
                if (u.atHome !== inZone) {
                    u.atHome = inZone;
                    this.formConfiguration.saveConfig(u);
                    Object.keys(this.registeredHomeNotifications).forEach((registeredHomeNotificationsKey) => {
                        this.registeredHomeNotifications[registeredHomeNotificationsKey](u);
                    });

                    // Trigger scenarios
                    this.scenarioManager.getScenarios().forEach((scenario) => {
                        if (scenario.UserScenarioForm && scenario.UserScenarioForm.mode) {
                            switch(scenario.UserScenarioForm.mode) {
                            case 0:
                                break;
                            case 1:
                                if (self.allUsersAtHome()) {
                                    self.scenarioManager.triggerScenario(scenario, false, {username: username, inZone: inZone, allUsersAtHome: true});
                                }
                                break;
                            case 2:
                                if (self.nobodyAtHome()) {
                                    self.scenarioManager.triggerScenario(scenario, false, {username: username, inZone: inZone, nobodyAtHome: true});
                                }
                                break;
                            case 3:
                                if (self.somebodyAtHome()) {
                                    self.scenarioManager.triggerScenario(scenario, false, {username: username, inZone: inZone, somebodyAtHome: true});
                                }
                                break;
                            }
                        }
                    });
                } else {
                    Logger.info("User " + username + " home status does not changed");
                }
            }
        } else {
            Logger.warn("Could not change user zone. Unknown user " + username);
        }

        this.updateTile();
    }

    /**
    * Register for user's home notifications, ie when a user leaves / enter home
    *
    * @param  {Function} cb A callback `(user) => {}`
    */
    registerHomeNotifications(cb) {
        const key = sha256(cb.toString());
        this.registeredHomeNotifications[key] = cb;
    }

    /**
    * Unregister for user's home notifications, ie when a user leaves / enter home
    *
    * @param  {Function} cb A callback `(user) => {}`
    */
    unregisterHomeNotifications(cb) {
        const key = sha256(cb.toString());
        delete this.registeredHomeNotifications[key];
    }

    /**
    * Process API callback
    *
    * @param  {APIRequest} apiRequest An APIRequest
    * @returns {Promise}  A promise with an APIResponse object
    */
    processAPI(apiRequest) {
        var self = this;

        if (apiRequest.route.startsWith(ROUTE_USER_ZONE)) {
            return new Promise((resolve) => {
                self.setUserZone(apiRequest.authenticationData.username, Boolean(parseInt(apiRequest.data.status)));
                resolve(new APIResponse.class(true, {success:true}));
            });
        } else if (apiRequest.route.startsWith(ROUTE_USER_LOCATION)) {
            return new Promise((resolve) => {
                self.setUserZone(apiRequest.authenticationData.username, GeoUtils.class.isInZone(this.appConfiguration.home.longitude, this.appConfiguration.home.latitude, this.appConfiguration.home.radius, parseFloat(apiRequest.data.longitude), parseFloat(apiRequest.data.latitude)));
                resolve(new APIResponse.class(true, {success:true}));
            });
        } else if (apiRequest.route.startsWith(ROUTE_USER_SETTINGS)) {
            return new Promise((resolve) => {
                const settings = {
                    home: this.environmentManager.getCoordinates(),
                    tilesExcluded:[]
                };
                resolve(new APIResponse.class(true, settings));
            });
        }
    }

    /**
     * Register bot actions
     *
     * @param  {BotEngine} botEngine The bot engine
     */
    registerBotActions(botEngine) {
        this.botEngine = botEngine;
        const self = this;
        if (this.botEngine) {
            this.botEngine.registerBotAction("whoisathome", (action, value, type, confidence, sender, cb) => {
                let maxConfidence = 0;
                let detectedUser = null;
                const usersAtHome = [];
                self.formConfiguration.getDataCopy().forEach((user) => {
                    const stringConfidence = this.botEngine.stringSimilarity().compareTwoStrings(user.name, value);
                    Logger.info("Confidence " + value + " | " + user.name + ": " + stringConfidence);
                    if (stringConfidence >= USER_COMPARE_CONFIDENCE && stringConfidence > maxConfidence) {
                        detectedUser = user;
                        maxConfidence = stringConfidence;
                    }
                    if (user.atHome) {
                        usersAtHome.push(user.name);
                    }
                });

                if (detectedUser) {
                    Logger.info("Match found ! : " + detectedUser.name);
                    if (detectedUser.atHome) {
                        cb(this.translateManager.t("user.bot.at.home", detectedUser.name));
                    } else {
                        cb(this.translateManager.t("user.bot.not.at.home", detectedUser.name));
                    }
                } else if (self.nobodyAtHome()){
                    cb(this.translateManager.t("user.bot.nobody.at.home"));
                } else {
                    if (usersAtHome.length === 1) {
                        cb(this.translateManager.t("user.bot.who.single.at.home", usersAtHome.concat()));
                    } else {
                        cb(this.translateManager.t("user.bot.who.at.home", usersAtHome.concat()));
                    }
                }
            });
        }
    }
}

module.exports = {class:UserManager, ERROR_USER_NOT_FOUND:ERROR_USER_NOT_FOUND};
