"use strict";
const PrivateProperties = require("./../PrivateProperties");

/**
 * Public API for users
 * @class
 */
class UserAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {UserManager} userManager The user manager instance
    //  * @returns {UserAPI}             The instance
    //  */
    constructor(userManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).userManager = userManager;
    }
    /* eslint-enable */

    /**
     * Add additional fields to user registration
     *
     * @param {FormObject} form A form object
     * @param  {...Object} inject Parameters injection on static methods
     */
    addAdditionalFields(form, ...inject) {
        PrivateProperties.oprivate(this).userManager.formConfiguration.addAdditionalFields(form, null, ...inject);
    }

    /**
     * Get all users (anonymized)
     *
     * @returns {Array} An array of users
     */
    getUsers() {
        const users = PrivateProperties.oprivate(this).userManager.getUsers();
        users.forEach((user) => {
            delete user.password;
        });
        return users;
    }

    /**
     * Check if all users are at home
     *
     * @returns {boolean} True if everybody is at home, false otherwise
     */
    allUsersAtHome() {
        return PrivateProperties.oprivate(this).userManager.allUsersAtHome();
    }

    /**
     * Check if no users are at home
     *
     * @returns {boolean} True if nobody is at home, false otherwise
     */
    nobodyAtHome() {
        return PrivateProperties.oprivate(this).userManager.nobodyAtHome();
    }

    /**
     * Check if at lesat one user is at home
     *
     * @returns {boolean} True if somebody is at home, false otherwise
     */
    somebodyAtHome() {
        return PrivateProperties.oprivate(this).userManager.somebodyAtHome();
    }

    /**
     * Register for user's home notifications, ie when a user leaves / enter home
     *
     * @param  {Function} cb A callback `(user) => {}`
     */
    registerHomeNotifications(cb) {
        PrivateProperties.oprivate(this).userManager.registerHomeNotifications(cb);
    }

    /**
     * Unregister for user's home notifications, ie when a user leaves / enter home
     *
     * @param  {Function} cb A callback `(user) => {}`
     */
    unregisterHomeNotifications(cb) {
        PrivateProperties.oprivate(this).userManager.unregisterHomeNotifications(cb);
    }
}

module.exports = {class:UserAPI};
