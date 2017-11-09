"use strict";
const smsDevice = require("sms-device");
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {


    /**
     * Prowl plugin class
     * @class
     */
    class SMS extends api.exported.MessageProvider {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The API
         * @returns {SMS}     The instance
         */
        constructor(api) {
            super(api);
            this.api = api;
        }

        /**
         * Send a message to all plugins.
         *
         * @param  {string|Array} [recipients="*"] The recipients. `*` for all users, otherwise an array of usernames - user `userAPI`, e.g. `["seb", "ema"]`
         * @param  {string} message          The notification message
         */
        sendMessage(recipients = "*", message) {
            this.api.userAPI.getUsers().forEach((user) => {
                if (recipients === "*" || (recipients instanceof Array && recipients.indexOf(user.username) !== -1)) {

                }
            });
        }
    }

    api.instance = new SMS(api);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "sms",
    version: "0.0.0",
    category: "message-provider",
    description: "SMS message provider",
    dependencies:["message-provider"]
};
