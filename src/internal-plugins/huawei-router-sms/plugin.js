"use strict";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class provides configuration form for SMS
     * @class
     */
    class HuaweiSmsForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} [id=null]                  An identifier
         * @param  {boolean} [criticalOnly=false] Critical only message
         * @returns {HuaweiSmsForm}                            The instance
         */
        constructor(id = null, criticalOnly = false) {
            super(id);

            /**
             * @Property("criticalOnly");
             * @Type("boolean");
             * @Title("huawei.sms.critical.only");
             * @Default(false);
             */
            this.criticalOnly = criticalOnly;
        }

        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {HuaweiSmsForm}      A form object
         */
        json(data) {
            return new HuaweiSmsForm(data.id, data.criticalOnly);
        }
    }

    /**
     * This class is extended by user form
     * @class
     */
    class HuaweiSmsUserForm extends api.exported.FormObject.class {
        /**
         * Huawei SMS user form
         *
         * @param  {number} id              An identifier
         * @param  {string} phoneNumber     A phone number
         * @returns {HuaweiSmsUserForm}                 The instance
         */
        constructor(id, phoneNumber) {
            super(id);

            /**
             * @Property("phoneNumber");
             * @Title("huawei.sms.user.phone");
             * @Type("string");
             */
            this.phoneNumber = phoneNumber;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {HuaweiSmsUserForm}      An instance
         */
        json(data) {
            return new HuaweiSmsUserForm(data.id, data.phoneNumber);
        }
    }

    api.userAPI.addAdditionalFields(HuaweiSmsUserForm);
    api.configurationAPI.register(HuaweiSmsForm);

    /**
     * Prowl plugin class
     * @class
     */
    class HuaweiSMS extends api.exported.MessageProvider {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The API
         * @returns {SMS}     The instance
         */
        constructor(api) {
            super(api);
            this.api = api;

            const self = this;
            this.api.coreAPI.registerEvent("huawei-sms-event", (message) => {
                const fromNumberRaw = message.phoneNumber.split(" ").join("");
                const fromNumber = parseInt(fromNumberRaw.substr(fromNumberRaw.length - 6));
                self.api.userAPI.getUsers().forEach((user) => {
                    if (user.HuaweiSmsUserForm && user.HuaweiSmsUserForm.phoneNumber && user.HuaweiSmsUserForm.phoneNumber.length > 5) {
                        const userNumberRaw = user.SMSUserForm.phoneNumber.split(" ").join("");
                        const userNumber = parseInt(userNumberRaw.substr(userNumberRaw.length - 6));

                        if (userNumber === fromNumber) {
                            self.onMessageReceived(user.username, message.message);
                        }
                    }
                });
            });
        }


        /**
         * Send a SMS message
         *
         * @param  {string} number  The pgone number
         * @param  {string} message the message
         */
        sendSMS(number, message) {
            api.getPluginInstance("huawei-router").sendSMS(number, message);
        }

        /**
         * Send a message to all plugins.
         *
         * @param  {string|Array} [recipients="*"] The recipients. `*` for all users, otherwise an array of usernames - user `userAPI`, e.g. `["seb", "ema"]`
         * @param  {string} message          The notification message
         * @param  {string} [action=null]    The action
         * @param  {string} [link=null]      The link
         * @param  {string} [picture=null]   The picture
         * @param  {boolean} [critical=false]   Critical message
         */
        sendMessage(recipients = "*", message, action = null, link = null, picture = null, critical = false) {
            action; // Lint
            link; // Lint
            picture; // Lint
            let criticalOnly = false;
            if (this.api.configurationAPI.getConfiguration()) {
                criticalOnly = !!this.api.configurationAPI.getConfiguration().criticalOnly;
            }
            this.api.userAPI.getUsers().forEach((user) => {
                if (message && (recipients === "*" || (recipients instanceof Array && recipients.indexOf(user.username) !== -1))) {
                    if (user.HuaweiSmsUserForm && user.HuaweiSmsUserForm.phoneNumber && user.HuaweiSmsUserForm.phoneNumber.length > 0 && (!criticalOnly || (critical && criticalOnly))) {
                        this.sendSMS(user.HuaweiSmsUserForm.phoneNumber.split(" ").join(""), message);
                    }
                }
            });
        }

    }

    api.instance = new HuaweiSMS(api);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "huawei-router-sms",
    version: "0.0.0",
    category: "message-provider",
    description: "Huawei SMS message provider for Huawei routers",
    defaultDisabled: true,
    dependencies:["message-provider", "huawei-router"]
};
