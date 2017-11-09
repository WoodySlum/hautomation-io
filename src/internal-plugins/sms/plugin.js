"use strict";

const fs = require("fs-extra");
const SerialPort = require("serialport");
const SMSServiceClass = require("./service.js");

const GAMMU_CONFIG_FOLDER = "gammu/";
const GAMMU_CONFIG_FILE = "gammu.rc";
const GAMMU_BASH_FILE = "receive.sh";
const GAMMU_CONFIG_FOLDER_INBOX = "spool/sms/inbox/";
const GAMMU_CONFIG_FOLDER_OUTBOX = "spool/sms/outbox/";
const GAMMU_CONFIG_FOLDER_SENT = "spool/sms/sent/";
const GAMMU_CONFIG_FOLDER_ERROR = "spool/sms/error/";
const ROUTE_RECEIVE_POST = ":/sms/receive/";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.installerAPI.register(["x32", "x64"], "brew install gammu", false, false, true);
    api.installerAPI.register(["arm", "arm64"], "apt-get install -y gammu gammu-smsd", true, true);

    /**
     * This class provides configuration form for SMS
     * @class
     */
    class SMSForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} [id=null]                  An identifier
         * @param  {string} [port=null] The port identifier
         * @returns {SMSForm}                            The instance
         */
        constructor(id = null, port = null) {
            super(id);

            /**
             * @Property("port");
             * @Type("string");
             * @Title("sms.port");
             * @Enum("getPorts");
             * @EnumNames("getPortsLabels");
             */
            this.port = port;
        }

        /**
         * Form injection method for ports
         *
         * @param  {...Object} inject The modules list array
         * @returns {Array}        An array of ports
         */
        static getPorts(...inject) {
            return inject[0];
        }

        /**
         * Form injection method for ports labels
         *
         * @param  {...Object} inject The modules list array
         * @returns {Array}        An array of ports labels
         */
        static getPortsLabels(...inject) {
            return inject[1];
        }

        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {SMSForm}      A form object
         */
        json(data) {
            return new SMSForm(data.id, data.port);
        }
    }

    /**
     * This class is extended by user form
     * @class
     */
    class SMSUserForm extends api.exported.FormObject.class {
        /**
         * Prowl user form
         *
         * @param  {number} id              An identifier
         * @param  {string} phoneNumber     A phone number
         * @returns {SMSUserForm}                 The instance
         */
        constructor(id, phoneNumber) {
            super(id);

            /**
             * @Property("phoneNumber");
             * @Title("sms.user.phone");
             * @Type("string");
             */
            this.phoneNumber = phoneNumber;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {SMSUserForm}      An instance
         */
        json(data) {
            return new SMSUserForm(data.id, data.phoneNumber);
        }
    }

    api.userAPI.addAdditionalFields(SMSUserForm);

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
            this.gammuConfigFile = null;
            this.init();
//AUTH_LOCAL_NETWORK_LEVEL
            this.api.webAPI.register(this, this.api.webAPI.constants().POST, ROUTE_RECEIVE_POST, this.api.webAPI.Authentication().AUTH_NO_LEVEL);

            this.api.configurationAPI.setUpdateCb(() => {
                this.init();
            });
        }

        init() {
            this.api.exported.Logger.info("Initializing SMS module");
            // Check serial ports
            this.getAvailableDevices((results) => {
                //console.log(results);
                const ports = [];
                const portsLabels = [];
                results.forEach((result) => {
                    ports.push(result.port);
                    portsLabels.push(result.name);
                });

                this.api.configurationAPI.register(SMSForm, ports, portsLabels);
            });

            const configuration = this.api.configurationAPI.getConfiguration();
            if (configuration && configuration.port) {
                // Write file config
                this.gammuConfigFile = api.exported.cachePath + GAMMU_CONFIG_FOLDER + GAMMU_CONFIG_FILE;
                const shellReceiveScriptFile  = api.exported.cachePath + GAMMU_CONFIG_FOLDER + GAMMU_BASH_FILE;
                const inbox = api.exported.cachePath + GAMMU_CONFIG_FOLDER + GAMMU_CONFIG_FOLDER_INBOX;
                const outbox = api.exported.cachePath + GAMMU_CONFIG_FOLDER + GAMMU_CONFIG_FOLDER_OUTBOX;
                const sent = api.exported.cachePath + GAMMU_CONFIG_FOLDER + GAMMU_CONFIG_FOLDER_SENT;
                const error = api.exported.cachePath + GAMMU_CONFIG_FOLDER + GAMMU_CONFIG_FOLDER_ERROR;

                fs.ensureDirSync(inbox);
                fs.ensureDirSync(outbox);
                fs.ensureDirSync(sent);
                fs.ensureDirSync(error);
                fs.writeFileSync(this.gammuConfigFile, this.generateGammuConfig(configuration.port, inbox, outbox, sent, error, shellReceiveScriptFile));
                fs.writeFileSync(shellReceiveScriptFile, this.generateGammuReceiveSh(this.api.environmentAPI.getLocalAPIUrl(), inbox));

                const SMSService = SMSServiceClass(api);
                this.service = new SMSService(this, this.gammuConfigFile);
                api.servicesManagerAPI.add(this.service);
            }
        }

        /**
         * Get available devices
         *
         * @param  {Function} cb A callback with the list of devices `(devices) => {}`
         */
        getAvailableDevices(cb) {
            SerialPort.list(function (err, ports) {
                const results = [];
                if (!err && ports) {
                    ports.forEach((port) => {
                        results.push({
                            port: port.comName,
                            name: port.productId + " (" + port.comName + ")"
                        });
                    });
                }
                cb(results);
            })
        }

        /**
         * Generates the Gammu configuration file
         *
         * @param  {string} port   The port
         * @param  {string} inbox  The inbox path
         * @param  {string} outbox The outbox path
         * @param  {string} sent   The sent path
         * @param  {string} error  The error path
         * @param  {string} shellReceiveScript  The shell receive script
         * @returns {string}        The configuration path
         */
        generateGammuConfig(port, inbox, outbox, sent, error, shellReceiveScript) {
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
runonreceive = ` + shellReceiveScript;

                return gammuConfig;
        }

        /**
         * Generates the content of the receive script
         *
         * @param  {string} url The url
         * @param  {string} inbox The inbox folder
         * @returns {string}     the shell content
         */
        generateGammuReceiveSh(url, inbox) {
            const shellScript = `#!/bin/sh
FILE=$1
MESSAGE=$SMS_1_TEXT
FROM=$SMS_1_NUMBER
INPUT="` + inbox + `"
curl -H "Content-Type: application/json" -X POST -k -L --data "{\\"data\":{\\"from\\":\\"$FROM\\", \\"message\\":\\"$MESSAGE\\"}}" ` + url;

            return shellScript;
        }

        /*
        #!/bin/sh

        FILE=$1
        MESSAGE=$SMS_1_TEXT
        FROM=$SMS_1_NUMBER
        INPUT="/var/spool/sms/inbox/"
        echo $1 > /tmp/toto
        curl -k -L --data "number=$FROM&message=$MESSAGE&method=smsReceive" https://127.0.0.1/services/
         */

        /**
         * Send a SMS message
         *
         * @param  {string} number  The pgone number
         * @param  {string} message the message
         */
        sendSMS(number, message) {
            if (this.gammuConfigFile) {
                this.installerAPI.executeCommand("gammu-smsd-inject -c " + this.gammuConfigFile + " TEXT " + number + " -text \"" + message + "\"" , false, (error, stdout, stderr) => {
                    if (error) {
                        this.api.exported.Logger.err(error.message);
                        this.api.exported.Logger.err(stderr);
                    }
                });
            }
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
                    if (this.gammuConfigFile && user.SMSUserForm && user.SMSUserForm.phoneNumber && user.SMSUserForm.phoneNumber.length > 0) {
                        this.sendSMS(user.SMSUserForm.phoneNumber, message);
                    }
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
            if (apiRequest.route === ROUTE_RECEIVE_POST) {
                console.log(apiRequest.data);
                return new Promise((resolve, reject) => {
                    resolve(this.api.webAPI.APIResponse(true, {success:true}));
                });
            }
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
