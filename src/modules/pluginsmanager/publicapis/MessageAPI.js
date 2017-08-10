"use strict";
const PrivateProperties = require("./../PrivateProperties");

/**
 * Public API for messages
 * @class
 */
class MessageAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {MessageManager} messageManager The messageManager
    //  * @returns {MessageAPI}             The instance
    //  */
    constructor(messageManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).messageManager = messageManager;
    }
    /* eslint-enable */

    /**
     * Send a message to all plugins.
     *
     * @param  {string|Array} [recipients="*"] The recipients. `*` for all users, otherwise an array of usernames - user `userAPI`, e.g. `["seb", "ema"]`
     * @param  {string} message          The notification message
     * @param  {string} [action=null]    The action
     * @param  {string} [link=null]      The link
     * @param  {string} [picture=null]   The picture
     */
    sendMessage(recipients = "*", message, action = null, link = null, picture = null) {
        PrivateProperties.oprivate(this).messageManager.sendMessage(recipients, message, action, link, picture);
    }

    /**
     * Register an object to message events. The callback must implement `onMessageReceived(message)` method
     *
     * @param  {Object} o An object that implements callback
     */
    register(o) {
        PrivateProperties.oprivate(this).messageManager.register(o);
    }

    /**
     * Unregister an object to message events
     *
     * @param  {Object} o An object that implements callback
     */
    unregister(o) {
        PrivateProperties.oprivate(this).messageManager.unregister(o);
    }

    /**
     * Callback when a message is received, dispatched to registered elements
     *
     * @param  {string} sender  The sender's username
     * @param  {string} message The message received
     */
    onMessageReceived(sender, message) {
        PrivateProperties.oprivate(this).messageManager.onMessageReceived(sender, message);
    }
}

module.exports = {class:MessageAPI};
