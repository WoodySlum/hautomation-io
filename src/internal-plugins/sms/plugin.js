"use strict";

const fs = require("fs-extra");
const SMSServiceClass = require("./service.js");

const GAMMU_CONFIG_FOLDER = "gammu/";
const GAMMU_CONFIG_FILE = "gammu.rc";
const GAMMU_CONFIG_FOLDER_INBOX = "spool/sms/inbox/";
const GAMMU_CONFIG_FOLDER_OUTBOX = "spool/sms/outbox/";
const GAMMU_CONFIG_FOLDER_SENT = "spool/sms/sent/";
const GAMMU_CONFIG_FOLDER_ERROR = "spool/sms/error/";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.installerAPI.register(["x32", "x64"], "brew install gammu", false, false, true);
    api.installerAPI.register(["arm", "arm64"], "apt-get install -y gammu gammu-smsd", true, true);

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
            this.service = null;
            this.init();
        }

        init() {
            // Write file config
            const gammuConfigFile = api.exported.cachePath + GAMMU_CONFIG_FOLDER + GAMMU_CONFIG_FILE;
            const inbox = api.exported.cachePath + GAMMU_CONFIG_FOLDER + GAMMU_CONFIG_FOLDER_INBOX;
            const outbox = api.exported.cachePath + GAMMU_CONFIG_FOLDER + GAMMU_CONFIG_FOLDER_OUTBOX;
            const sent = api.exported.cachePath + GAMMU_CONFIG_FOLDER + GAMMU_CONFIG_FOLDER_SENT;
            const error = api.exported.cachePath + GAMMU_CONFIG_FOLDER + GAMMU_CONFIG_FOLDER_ERROR;

            fs.ensureDirSync(inbox);
            fs.ensureDirSync(outbox);
            fs.ensureDirSync(sent);
            fs.ensureDirSync(error);
            fs.writeFileSync(gammuConfigFile, this.generateGammuConfig("/dev/ttyUSB1", inbox, outbox, sent, error));

            const SMSService = SMSServiceClass(api);
            this.service = new SMSService(this, gammuConfigFile);
            api.servicesManagerAPI.add(this.service);
        }

        /**
         * Generates the Gammu configuration file
         *
         * @param  {string} port   The port
         * @param  {string} inbox  The inbox path
         * @param  {string} outbox The outbox path
         * @param  {string} sent   The sent path
         * @param  {string} error  The error path
         * @returns {string}        The configuration path
         */
        generateGammuConfig(port, inbox, outbox, sent, error) {
            const gammuConfig = `[gammu]
port = ` + port + `
connection = at
model =
synchronizetime = no
logfile =
logformat = nothing
use_locking =
gammuloc =

[smsd]
port = ` + port + `
connection = at
model =
synchronizetime = no
logfile =
logformat = nothing
use_locking =
gammuloc =
service = FILES
inboxpath = `+ inbox + `
outboxpath = `+ outbox + `
sentsmspath = ` + sent + `
errorsmspath = ` + error + `
`;

                return gammuConfig;
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
