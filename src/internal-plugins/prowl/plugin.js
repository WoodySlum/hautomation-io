"use strict";
const Prowler = require("prowler");

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    /**
     * This class is extended by user form
     * @class
     */
    class ProwlForm extends api.exported.FormObject.class {
        /**
         * Prowl user form
         *
         * @param  {number} id              An identifier
         * @param  {string} prowlApiKey     A prowl API key
         * @returns {SensorForm}                 The instance
         */
        constructor(id, prowlApiKey) {
            super(id);

            /**
             * @Property("prowlApiKey");
             * @Title("prowl.api.key.title");
             * @Type("string");
             */
            this.prowlApiKey = prowlApiKey;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {ProwlForm}      An instance
         */
        json(data) {
            return new ProwlForm(data.id, data.prowlApiKey);
        }
    }

    api.userAPI.addAdditionalFields(ProwlForm);

    /**
     * Prowl plugin class
     * @class
     */
    class Prowl extends api.exported.MessageProvider {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The API
         * @returns {Prowl}     The instance
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
                    try {
                        var notification = new Prowler.connection(user.prowlApiKey);
                        // let actionprefixed = "hautomation://";
                        // if (action) {
                        //     actionprefixed += action;
                        // }
                        notification.send({
                            "application": "Hautomation",
                            "event": message,
                            "description": ""
                        });
                    } catch(e) {
                        api.exported.Logger.err(e.message);
                    }
                }
            });
        }
    }

    api.instance = new Prowl(api);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "prowl",
    version: "0.0.0",
    category: "message-provider",
    description: "Prowl message sending",
    dependencies:["message-provider"]
};
