"use strict";
const Logger = require("./../../logger/Logger");
const PluginsManager = require("./../pluginsmanager/PluginsManager");
const DbSchemaConverter = require("./../dbmanager/DbSchemaConverter");
const DbHelper = require("./../dbmanager/DbHelper");
const DbMessage = require("./DbMessage");
const WebServices = require("./../../services/webservices/WebServices");
const APIResponse = require("./../../services/webservices/APIResponse");
const Authentication = require("./../authentication/Authentication");
const DateUtils = require("./../../utils/DateUtils");
const Tile = require("./../dashboardmanager/Tile");
const Icons = require("./../../utils/Icons");
const MessageScenarioForm = require("./MessageScenarioForm");
const MessageScenarioTriggerForm = require("./MessageScenarioTriggerForm");
const fs = require("fs-extra");
// const sizeof = require("object-sizeof");

const DB_VERSION = "0.0.0";
const LOCK_FILE_PREFIX = "message-lock-time-";
const ROUTE_GET = ":/messages/get/";
const ROUTE_SET = ":/messages/set/";
const MAX_SIZE_OF_MESSAGES_B = 1000000;

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
     * @param  {WebServices} webServices    The web services
     * @param  {TranslateManager} translateManager    The translate manager
     * @param  {DashboardManager} dashboardManager    The dashboard manager
     * @param  {ScenarioManager} scenarioManager    The scenario manager
     * @param  {string} cachePath The app cache
     * @returns {InstallationManager}             The instance
     */
    constructor(pluginsManager = null, eventBus, userManager, dbManager, webServices, translateManager, dashboardManager, scenarioManager, cachePath) {
        this.pluginsManager = pluginsManager;
        this.eventBus = eventBus;
        this.userManager = userManager;
        this.dbManager = dbManager;
        this.webServices = webServices;
        this.translateManager = translateManager;
        this.dashboardManager = dashboardManager;
        this.scenarioManager = scenarioManager;
        this.dbSchema = DbSchemaConverter.class.toSchema(DbMessage.class);
        this.dbManager.initSchema(this.dbSchema, DB_VERSION, null);
        this.dbHelper = new DbHelper.class(this.dbManager, this.dbSchema, DbSchemaConverter.class.tableName(DbMessage.class), DbMessage.class);
        this.cachePath = cachePath;
        this.registered = [];

        const self = this;
        this.eventBus.on(PluginsManager.EVENT_LOADED, (pluginsManager) => {
            self.pluginsManager = pluginsManager;
        });

        // Web services
        this.webServices.registerAPI(this, WebServices.GET, ROUTE_GET + "[timestamp*]/", Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, ROUTE_SET, Authentication.AUTH_USAGE_LEVEL);

        // Dashboard
        const tile = new Tile.class(this.dashboardManager.themeManager, "chat", Tile.TILE_GENERIC_ACTION, Icons.class.list()["uniF1D7"], null, this.translateManager.t("tile.chat"), null, null, null, 0, 500, "chat");
        this.dashboardManager.registerTile(tile);

        // Scenario
        const recipientListIds = ["*", "**"];
        const recipientListLabels = [this.translateManager.t("message.scenario.recipient.all"), this.translateManager.t("message.scenario.recipient.provided")];
        this.userManager.getUsers().forEach((user) => {
            recipientListIds.push(user.username);
            recipientListLabels.push(user.name);
        });

        this.scenarioManager.registerWithInjection(MessageScenarioForm.class, (scenario, additionalInfos) => {
            self.triggerScenario(scenario, self, additionalInfos);
        }, "message.scenario.title", null, null, recipientListIds, recipientListLabels);
        this.scenarioManager.register(MessageScenarioTriggerForm.class, null, "message.scenario.trigger.title", 200, true);
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
     * @param  {boolean} [critical=false]   Critical message
     */
    sendMessage(recipients = "*", message, action = null, link = null, picture = null, critical = false) {
        Logger.info("Sending message '" + message + "' to " + recipients);

        if (this.pluginsManager) {
            this.pluginsManager.getPluginsByCategory("message-provider").forEach((plugin) => {
                if (plugin.instance.sendMessage instanceof Function) {
                    plugin.instance.sendMessage(recipients, message, action, link, picture, critical);
                } else {
                    Logger.warn("sendMessage method for plugin " + plugin.name + " not implemented. Could not send message.");
                }
            });
        }

        this.userManager.getUsers().forEach((user) => {
            if (recipients === "*" || (recipients instanceof Array && recipients.indexOf(user.username) !== -1)) {
                const dbMessage = new DbMessage.class(this.dbHelper, user.username, null, message, action, link, picture, 1);
                dbMessage.save();
            }
        });
    }

    /**
     * Callback when a message is received, dispatched to registered elements
     *
     * @param  {string} sender  The sender's username
     * @param  {string} message The message received
     * @param  {Function} botCb A callback that should be called when data processing is done
     */
    onMessageReceived(sender, message, botCb = null) {
        let found = false;
        this.userManager.getUsers().forEach((user) => {
            if (sender === user.username) {
                found = true;
                // Trigger scenenario
                let scenarioTriggered = false;
                this.scenarioManager.getScenarios().forEach((scenario) => {
                    if (scenario && scenario.MessageScenarioTriggerForm && scenario.MessageScenarioTriggerForm.length > 0) {
                        scenario.MessageScenarioTriggerForm.forEach((messageScenarioTriggerForm) => {
                            if (messageScenarioTriggerForm.keyword && messageScenarioTriggerForm.keyword.length > 0) {
                                if (message.toLowerCase().indexOf(messageScenarioTriggerForm.keyword.toLowerCase()) >= 0) {
                                    this.scenarioManager.triggerScenario(scenario, null, {username: user.username});
                                    this.sendMessage([user.username], this.translateManager.t("message.manager.scenario.triggered", scenario.name));
                                    scenarioTriggered = true;
                                }
                            }
                        });
                    }
                });

                const dbMessage = new DbMessage.class(this.dbHelper, null, user.username, message, null, null, null, 0);
                let count = 1;
                this.registered.forEach((register) => {
                    if (register.onMessageReceived instanceof Function) {
                        if (!scenarioTriggered) { // Dispatch only if no scenario triggered
                            register.onMessageReceived(dbMessage, () => {
                                // This is the last callback
                                if (count === this.registered.length) {
                                    dbMessage.save(() => {
                                        if (botCb) {
                                            botCb();
                                        }
                                    });
                                }
                                count++;
                            });
                        }
                    }
                });

            }
        });

        if (!found && botCb) {
            botCb();
        }
    }

    /**
     * Get messages
     *
     * @param  {Function} cb            A callback `(err, results) => {}`
     * @param  {string}   username      A username
     * @param  {number}   [lastTimestamp=null] Last timestamp retrieval
     */
    getMessages(cb, username, lastTimestamp = null) {
        if (!lastTimestamp) {
            lastTimestamp = 0;
        }
        const request = this.dbHelper.RequestBuilder()
            .select()
            .complexWhere("(recipient " + this.dbHelper.Operators().LIKE + " '" + username + "' OR " + "sender " + this.dbHelper.Operators().LIKE + " '" + username + "')")
            .where(this.dbHelper.Operators().FIELD_TIMESTAMP, this.dbHelper.Operators().GT, parseInt(lastTimestamp)===0?1:parseInt(lastTimestamp))
            .order(this.dbHelper.Operators().DESC, this.dbHelper.Operators().FIELD_TIMESTAMP)
            .order(this.dbHelper.Operators().DESC, this.dbHelper.Operators().FIELD_ID)
            .first(20);

        this.dbHelper.getObjects(request, (error, objects) => {
            if (error) {
                cb(error);
            } else {
                let results = [];
                objects.forEach((dbObj) => {
                    results.push({
                        id:dbObj.id,
                        dt:DateUtils.class.dateFormatted(this.translateManager.t("datetime.format"), DateUtils.class.dateToTimestamp(dbObj.timestamp)),
                        rawDt:dbObj.timestamp,
                        timestamp:DateUtils.class.dateToTimestamp(dbObj.timestamp),
                        recipient:dbObj.recipient,
                        sender:dbObj.sender,
                        message:dbObj.message,
                        action:dbObj.action,
                        link:dbObj.link,
                        picture:dbObj.picture,
                        received:dbObj.received
                    });
                });

                // while (sizeof(results) > MAX_SIZE_OF_MESSAGES_B) {
                //     results.splice(-1,1);
                // }

                cb(null, results);
            }
        });
    }

    /**
     * Get last timestamp for user message
     *
     * @param  {Function} cb            A callback `(err, results) => {}`
     * @param  {string}   username      A username
     */
    getLastTimestamp(cb, username) {
        const request = this.dbHelper.RequestBuilder()
            .select()
            .complexWhere("(recipient " + this.dbHelper.Operators().LIKE + " '" + username + "' OR " + "sender " + this.dbHelper.Operators().LIKE + " '" + username + "')")
            .order(this.dbHelper.Operators().DESC, this.dbHelper.Operators().FIELD_TIMESTAMP)
            .order(this.dbHelper.Operators().DESC, this.dbHelper.Operators().FIELD_ID)
            .first(1);
        this.dbHelper.getObjects(request, (error, objects) => {
            if (error) {
                cb(error);
            } else if (!objects || objects.length === 0){
                cb(Error("Empty content"));
            } else {
                cb(null, DateUtils.class.dateToTimestamp(objects[0].timestamp));
            }
        });
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        var self = this;

        // Get messages
        if (apiRequest.route.startsWith(ROUTE_GET)) {
            return new Promise((resolve, reject) => {
                self.getMessages((err, results) => {
                    if (err) {
                        reject(new APIResponse.class(false, {}, 467, err.message));
                    } else {
                        resolve(new APIResponse.class(true, results));
                    }
                }, apiRequest.authenticationData.username, apiRequest.data.timestamp);

            });
        } else if (apiRequest.route === (ROUTE_SET)) {
            return new Promise((resolve, reject) => {
                self.getLastTimestamp((err, timestamp) => {
                    self.onMessageReceived(apiRequest.authenticationData.username, apiRequest.data.message, () => {
                        if (err) {
                            Logger.err(err.message);
                            resolve(new APIResponse.class(true, []));
                        } else {
                            self.getMessages((error, results) => {
                                if (error) {
                                    reject(new APIResponse.class(false, {}, 467, err.message));
                                } else {
                                    resolve(new APIResponse.class(true, results));
                                }
                            }, apiRequest.authenticationData.username, (parseInt(timestamp) + 1));
                        }
                    });
                }, apiRequest.authenticationData.username);
            });
        }
    }

    /**
     * Trigger scenario elements
     *
     * @param  {Object} scenario A dynamic scenario object
     * @param  {DeviceManager} context  The context
     * @param  {Object} additionalInfos Additional infos
     */
    triggerScenario(scenario, context, additionalInfos) {
        if (scenario && scenario.MessageScenarioForm) {
            if (scenario.MessageScenarioForm.message && scenario.MessageScenarioForm.message.length > 0) {
                let lockTime = 0;
                if (scenario.MessageScenarioForm.lockTime) {
                    lockTime = parseInt(scenario.MessageScenarioForm.lockTime) * 3600;
                }
                const messageCachePath = this.cachePath + "/" + LOCK_FILE_PREFIX + scenario.id;
                let lastMessageSentTimestamp = 0;
                if (fs.existsSync(messageCachePath)) {
                    lastMessageSentTimestamp = parseInt(fs.readFileSync(messageCachePath));
                }

                if (DateUtils.class.timestamp() > (lastMessageSentTimestamp + lockTime)) {
                    let recipient = "*";
                    let canSend = true;
                    if (scenario.MessageScenarioForm.recipient && scenario.MessageScenarioForm.recipient.length > 0) {
                        recipient = scenario.MessageScenarioForm.recipient;
                        if (recipient != "*" && recipient != "**") {
                            recipient = [scenario.MessageScenarioForm.recipient];
                        } else if (recipient == "**" && additionalInfos.username) {
                            recipient = [additionalInfos.username];
                        } else if (recipient == "**") {
                            canSend = false;
                            Logger.warn("Could not send scenario message : no username in additionalInfos");
                        }
                    }
                    if (canSend) {
                        context.sendMessage(recipient, scenario.MessageScenarioForm.message);
                        fs.writeFileSync(messageCachePath, DateUtils.class.timestamp());
                    }
                } else {
                    Logger.info("Could not send '" + scenario.MessageScenarioForm.message + "'. Lock time " + DateUtils.class.timestamp() + " / " + (lastMessageSentTimestamp + lockTime));
                }
            }
        }
    }
}

module.exports = {class:MessageManager};
