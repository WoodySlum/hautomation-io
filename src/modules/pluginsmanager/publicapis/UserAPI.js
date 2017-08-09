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
     */
    addAdditionalFields(form) {
        PrivateProperties.oprivate(this).userManager.formConfiguration.addAdditionalFields(form);
    }
}

module.exports = {class:UserAPI};
