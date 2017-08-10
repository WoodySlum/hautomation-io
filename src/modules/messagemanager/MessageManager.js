"use strict";
const Logger = require("./../../logger/Logger");
const PluginsManager = require("./../pluginsmanager/PluginsManager");
const DbSchemaConverter = require("./../dbmanager/DbSchemaConverter");
const DbHelper = require("./../dbmanager/DbHelper");
const DbMessage = require("./DbMessage");


const DB_VERSION = "0.0.0";

/**
 * This class allows to manage message sending
 * @class
 */
class MessageManager {
    /**
     * Constructor
     *
     * @param  {PluginsManager} pluginsManager    The plugins manager
     * @param  {EventEmitter} eventBus    The global event bus
     * @param  {UserManager} userManager    The user manager
     * @param  {DbManager} dbManager    The database manager
     * @returns {InstallationManager}             The instance
     */
    constructor(pluginsManager, eventBus, userManager, dbManager) {
        this.pluginsManager = null;
        this.eventBus = eventBus;
        this.userManager = userManager;
        this.dbManager = dbManager;
        this.dbSchema = DbSchemaConverter.class.toSchema(DbMessage.class);
        this.dbManager.initSchema(this.dbSchema, DB_VERSION, null);
        this.dbHelper = new DbHelper.class(this.dbManager, this.dbSchema, DbSchemaConverter.class.tableName(DbMessage.class), DbMessage.class);
        this.registered = [];

        const self = this;
        this.eventBus.on(PluginsManager.EVENT_LOADED, (pluginsManager) => {
            self.pluginsManager = pluginsManager;
        });
    }

    /**
     * Register an object to message events. The callback must implement `onMessageReceived(message)` method
     *
     * @param  {Object} o An object that implements callback
     */
    register(o) {
        if (this.registered.indexOf(o) === -1) {
            this.registered.push(o);
        }
    }

    /**
     * Unregister an object to message events
     *
     * @param  {Object} o An object that implements callback
     */
    unregister(o) {
        const index = this.registered.indexOf(o);
        if (index !== -1) {
            this.registered.splice(index, 1);
        }
    }

    /**
     * Send a message to all plugins.
     *
     * @param  {string|Array} [recipients="*"] The recipients. `*` for all users, otherwise an array of usernames, e.g. `["seb", "ema"]`
     * @param  {string} message          The notification message
     * @param  {string} [action=null]    The action
     * @param  {string} [link=null]      The link
     * @param  {string} [picture=null]   The picture
     */
    sendMessage(recipients = "*", message, action = null, link = null, picture = null) {

        if (this.pluginsManager) {
            this.pluginsManager.getPluginsByCategory("message-provider").forEach((plugin) => {
                if (plugin.instance.sendMessage instanceof Function) {
                    plugin.instance.sendMessage(recipients, message, action, link, picture);
                } else {
                    Logger.warn("sendMessage method for plugin " + plugin.name + " not implemented. Could not send message.");
                }
            });
        }

        this.userManager.getUsers().forEach((user) => {
            if (recipients === "*" || (recipients instanceof Array && recipients.indexOf(user.username) !== -1)) {
                const dbMessage = new DbMessage.class(this.dbHelper, user.username, null, message, action, link, picture);
                dbMessage.save();
            }
        });
    }

    /**
     * Callback when a message is received, dispatched to registered elements
     *
     * @param  {string} sender  The sender's username
     * @param  {string} message The message received
     */
    onMessageReceived(sender, message) {
        this.userManager.getUsers().forEach((user) => {
            if (sender === user.username) {
                const dbMessage = new DbMessage.class(this.dbHelper, null, user.username, message);
                this.registered.forEach((register) => {
                    if (register.onMessageReceived instanceof Function) {
                        register.onMessageReceived(dbMessage);
                    }
                });
                dbMessage.save();
            }
        });
    }
}

module.exports = {class:MessageManager};
