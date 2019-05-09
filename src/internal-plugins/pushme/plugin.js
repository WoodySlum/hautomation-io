"use strict";

const request = require("request");

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by user form
     * @class
     */
    class PushMeForm extends api.exported.FormObject.class {
        /**
         * Push me user form
         *
         * @param  {number} id              An identifier
         * @param  {string} pushMeToken     A push me token
         * @returns {PushMeForm}                 The instance
         */
        constructor(id, pushMeToken) {
            super(id);

            /**
             * @Property("pushMeToken");
             * @Title("push.me.token");
             * @Type("string");
             */
            this.pushMeToken = pushMeToken;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {PushMeForm}      An instance
         */
        json(data) {
            return new PushMeForm(data.id, data.pushMeToken);
        }
    }

    api.userAPI.addAdditionalFields(PushMeForm);

    /**
     * Push me plugin class
     * @class
     */
    class PushMe extends api.exported.MessageProvider {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The API
         * @returns {PushMe}     The instance
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
                        if (user.PushMeForm && user.PushMeForm.pushMeToken && user.PushMeForm.pushMeToken.length > 0) {
                            request.post("https://pushmeapi.jagcesar.se", {
                                form: {
                                    title:message,
                                    token: user.PushMeForm.pushMeToken
                                }
                            }, (error) => {
                                if (error) {
                                    api.exported.Logger.warn(error.message);
                                }
                            });
                        }
                    } catch(e) {
                        api.exported.Logger.warn(e.message);
                    }
                }
            });
        }
    }

    api.instance = new PushMe(api);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "pushme",
    version: "0.0.0",
    category: "message-provider",
    description: "Push me message sending",
    dependencies:["message-provider"]
};
