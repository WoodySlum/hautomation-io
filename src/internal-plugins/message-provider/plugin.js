"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by message providers
     * @class
     */
    class MessageProvider {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The api
         * @returns {MessageProvider}     The instance
         */
        constructor(api) {
            this.api = api;
        }

        /**
         * Callback when a message is received, dispatched to registered elements
         *
         * @param  {string} sender  The sender's username
         * @param  {string} message The message received
         */
        onMessageReceived(sender, message) {
            this.api.messageAPI.onMessageReceived(sender, message);
        }
    }

    api.sensorAPI.registerClass(MessageProvider);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "message-provider",
    version: "0.0.0",
    category: "message-provider-interface",
    description: "Message provider interface"
};
