"use strict";
const Logger = require("./../../logger/Logger");
const Authentication = require("./../authentication/Authentication");
const FormConfiguration = require("./../formconfiguration/FormConfiguration");
const UserForm = require("./UserForm");
const ImageUtils = require("./../../utils/ImageUtils");
const Tile = require("./../dashboardmanager/Tile");
const Icons = require("./../../utils/Icons");

const CONF_KEY = "users";
const ERROR_USER_NOT_FOUND = "ERROR_USER_NOT_FOUND";

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
     * @returns {UserManager} The instance
     */
    constructor(confManager, formManager, webServices, dashboardManager) {
        this.formConfiguration = new FormConfiguration.class(confManager, formManager, webServices, CONF_KEY, true, UserForm.class);
        this.confManager = confManager;
        this.dashboardManager = dashboardManager;
        this.updateTile();
    }

    /**
     * Update user tile
     */
    updateTile() {
        const pics = [];
        this.getUsers().forEach((user) => {
            const pic = ImageUtils.class.sanitizeFormConfiguration(user.picture);
            if (pic) {
                if (user.atHome) {
                    ImageUtils.class.resize(pic, (err, data) => {
                        if (!err) {
                            pics.push(data);
                            const tile = new Tile.class(this.dashboardManager.themeManager, "users", Tile.TILE_PICTURES, Icons.class.list()["group"], null, null, null, null, pics);
                            this.dashboardManager.registerTile(tile);
                        } else {
                            Logger.err(err.message);
                        }
                    });
                } else {
                    ImageUtils.class.blur(pic, (err, data) => {
                        if (!err) {
                            pics.push(data);
                            const tile = new Tile.class(this.dashboardManager.themeManager, "users", Tile.TILE_PICTURES, Icons.class.list()["group"], null, null, null, null, pics);
                            this.dashboardManager.registerTile(tile);
                        } else {
                            Logger.err(err.message);
                        }
                    });
                }
            }
        });
    }

    /**
     * Return a COPY of the user array
     *
     * @returns {[User]} An array of Users
     */
    getUsers() {
        const copy = [];
        this.formConfiguration.data.forEach((user) => {
            copy.push(Object.assign({}, user));
        });

        return copy;
    }

    /**
     * Get a user with username
     *
     * @param  {string} username The username
     * @returns {User}   A user, null if user does not exists
     */
    getUser(username) {
        let foundUser = null;
        this.formConfiguration.data.forEach((user) => {
            if (user.username.toLowerCase() === username.toLowerCase()) {
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
}

module.exports = {class:UserManager, ERROR_USER_NOT_FOUND:ERROR_USER_NOT_FOUND};
