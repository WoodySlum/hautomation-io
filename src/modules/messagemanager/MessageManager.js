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
const MessageScenarioForm = require("./MessageScenarioForm");
const MessageScenarioTriggerForm = require("./MessageScenarioTriggerForm");
const fs = require("fs-extra");
const sizeof = require("object-sizeof");

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
        const background = fs.readFileSync("./res/tiles/communicate.jpg").toString("base64");
        // Credits : Freepik / https://www.flaticon.com/free-icon/chat_3659734
        const svg = "<svg id=\"Capa_1\" enable-background=\"new 0 0 512 512\" height=\"512\" viewBox=\"0 0 512 512\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><g><g><g><g><g><path d=\"m206.527 240.21c-1.525 0-3.057-.349-4.472-1.056-3.388-1.694-5.527-5.157-5.527-8.944v-21.017h-12.068c-11.33 0-20.548-9.217-20.548-20.547v-109.392c0-11.332 9.22-20.551 20.552-20.551h306.985c11.332 0 20.551 9.219 20.551 20.551v109.393c0 11.33-9.218 20.547-20.548 20.547h-240.227l-38.697 29.018c-1.764 1.321-3.877 1.998-6.001 1.998zm-22.063-161.507c-.305 0-.552.247-.552.551v109.393c0 .302.246.547.548.547h22.068c5.522 0 10 4.477 10 10v11.018l25.364-19.02c1.73-1.298 3.836-1.999 5.999-1.999h243.56c.302 0 .548-.245.548-.547v-109.392c0-.304-.247-.551-.551-.551z\"/></g></g><g><g><g><path d=\"m440.286 117.453h-204.659c-5.522 0-10-4.478-10-10s4.478-10 10-10h204.659c5.522 0 10 4.478 10 10 0 5.523-4.477 10-10 10z\"/></g></g><g><g><path d=\"m440.286 164.46h-36.02c-5.522 0-10-4.478-10-10 0-5.523 4.478-10 10-10h36.02c5.522 0 10 4.477 10 10 0 5.522-4.477 10-10 10z\"/></g></g><g><g><path d=\"m354.27 164.46c-4.179 0-8.004-2.709-9.414-6.636-1.391-3.874-.195-8.327 2.946-10.986 3.274-2.771 8.099-3.134 11.745-.868 3.491 2.17 5.336 6.408 4.523 10.44-.931 4.615-5.083 8.05-9.8 8.05z\"/></g></g><g><g><path d=\"m305.267 164.46h-69.64c-5.522 0-10-4.478-10-10 0-5.523 4.478-10 10-10h69.64c5.522 0 10 4.477 10 10 0 5.522-4.478 10-10 10z\"/></g></g></g></g><g><g><g><g><path d=\"m74.752 126.191c-34.791 0-63.096-28.305-63.096-63.096s28.305-63.095 63.096-63.095c34.792 0 63.097 28.305 63.097 63.096s-28.305 63.095-63.097 63.095zm0-106.191c-23.763 0-43.096 19.333-43.096 43.096s19.333 43.096 43.096 43.096c23.764 0 43.097-19.333 43.097-43.096s-19.333-43.096-43.097-43.096z\"/></g></g><g><g><g><path d=\"m139.505 240.21h-129.505c-5.523 0-10-4.478-10-10v-65.948c0-15.274 12.427-27.701 27.701-27.701h94.103c15.274 0 27.701 12.427 27.701 27.701v65.948c0 5.522-4.478 10-10 10zm-119.505-20h109.505v-55.948c0-4.246-3.455-7.701-7.701-7.701h-94.103c-4.246 0-7.701 3.455-7.701 7.701z\"/></g></g></g></g></g></g><g><g><g><path d=\"m305.473 512c-2.125 0-4.235-.677-6-1.999l-38.697-29.018h-240.228c-11.33 0-20.548-9.217-20.548-20.548v-109.391c0-11.332 9.219-20.551 20.551-20.551h306.985c11.332 0 20.552 9.219 20.552 20.551v109.392c0 11.33-9.218 20.548-20.548 20.548h-12.068v21.016c0 3.787-2.14 7.25-5.527 8.944-1.416.707-2.948 1.056-4.472 1.056zm-284.922-161.507c-.304 0-.551.247-.551.551v109.392c0 .302.246.548.548.548h243.561c2.163 0 4.269.701 5.999 1.999l25.364 19.02v-11.019c0-5.522 4.477-10 10-10h22.068c.302 0 .548-.246.548-.548v-109.392c0-.304-.247-.551-.552-.551z\"/></g></g><g><g><g><path d=\"m276.373 389.243h-204.659c-5.522 0-10-4.478-10-10s4.477-10 10-10h204.659c5.523 0 10 4.478 10 10 0 5.523-4.477 10-10 10z\"/></g></g><g><g><path d=\"m107.733 436.249h-36.02c-5.522 0-10-4.477-10-10 0-5.522 4.477-10 10-10h36.02c5.522 0 10 4.478 10 10 0 5.523-4.477 10-10 10z\"/></g></g><g><g><path d=\"m157.73 436.25c-4.184 0-7.994-2.707-9.405-6.636-1.403-3.906-.183-8.403 3.016-11.056 3.1-2.57 7.551-3.013 11.101-1.124 3.685 1.961 5.79 6.157 5.18 10.282-.713 4.833-5.006 8.534-9.892 8.534z\"/></g></g><g><g><path d=\"m276.373 436.249h-69.64c-5.522 0-10-4.477-10-10 0-5.522 4.478-10 10-10h69.64c5.523 0 10 4.478 10 10 0 5.523-4.477 10-10 10z\"/></g></g></g></g><g><g><g><g><path d=\"m437.248 397.981c-34.792 0-63.097-28.305-63.097-63.096s28.305-63.096 63.097-63.096c34.791 0 63.096 28.305 63.096 63.096 0 34.792-28.305 63.096-63.096 63.096zm0-106.191c-23.764 0-43.097 19.333-43.097 43.096s19.333 43.096 43.097 43.096c23.763 0 43.096-19.333 43.096-43.096s-19.333-43.096-43.096-43.096z\"/></g></g><g><g><g><path d=\"m502 512h-129.505c-5.522 0-10-4.478-10-10v-65.948c0-15.274 12.427-27.701 27.701-27.701h94.103c15.274 0 27.701 12.427 27.701 27.701v65.948c0 5.522-4.478 10-10 10zm-119.505-20h109.505v-55.948c0-4.246-3.455-7.701-7.701-7.701h-94.103c-4.246 0-7.701 3.455-7.701 7.701z\"/></g></g></g></g></g></g></svg>";
        const tile = new Tile.class(this.dashboardManager.themeManager, "chat", Tile.TILE_GENERIC_ACTION_DARK, svg, null, this.translateManager.t("tile.chat"), null, background, null, 0, 500, "chat");
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

                while (sizeof(results) > MAX_SIZE_OF_MESSAGES_B) {
                    results.splice(-1,1);
                }

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
