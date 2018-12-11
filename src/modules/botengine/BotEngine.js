"use strict";
const Logger = require("./../../logger/Logger");
const Tile = require("./../dashboardmanager/Tile");
const WebServices = require("./../../services/webservices/WebServices");
const APIResponse = require("./../../services/webservices/APIResponse");
const Authentication = require("./../authentication/Authentication");
// const sha256 = require("sha256");
// const DateUtils = require("./../../utils/DateUtils");

const os = require("os");
const pathl = require("path");
const callsite = require("callsite");
const fs = require("fs-extra");

const record = require("node-record-lpcm16");
// const snowboy = require("snowboy");
const header = require("waveheader");
const stream = require("stream");
const WitSpeech = require("node-witai-speech");
const {Wit} = require("node-wit");
const audiohub = require("audiohub");
const path = require("path");
const StringSimilarity = require("string-similarity");

const ROUTE_BOT_VOCAL = "/bot/vocal/";
const ERROR_MIC_IS_NOT_DEFINED = "Could not execute action : mic is not defined";

/**
 * This class manage the Hautomation bot
 * @class
 */
class BotEngine {
    /**
     * Constructor
     *
     * @param  {AppConfiguration} appConfiguration The app configuration object
     * @param  {TranslateManager} translateManager The translation manager
     * @param  {MessageManager} messageManager The message manager
     * @param  {Object} botConfiguration The bot configuration
     * @param  {InstallationManager} installationManager The installation manager
     * @param  {DashboardManager} dashboardManager The dashboard manager
     * @param  {ThemeManager} themeManager The theme manager
     * @param  {WebServices} webServices The web services
     * @returns {BotEngine} The instance
     */
    constructor(appConfiguration, translateManager, messageManager, botConfiguration, installationManager, dashboardManager, themeManager, webServices) {
        this.messageManager = messageManager;
        this.translateManager = translateManager;
        this.messageManager.register(this);
        this.botConfiguration = botConfiguration;
        this.appConfiguration = appConfiguration;
        this.installationManager = installationManager;
        this.dashboardManager = dashboardManager;
        this.themeManager = themeManager;
        this.webServices = webServices;
        this.mic = null;
        this.enableVocalCommands = false;

        // Bot actions
        this.botActions = {};
        if (!process.env.TEST && this.appConfiguration.bot.enable) {
            this.enableVocalCommands = true;
            this.voiceDetect();
        }

        if (os.platform() === "linux") {
            const asoundrcFile = os.homedir() + "/.asoundrc";
            if (!fs.existsSync(asoundrcFile)) {
                const asoundrcContent = fs.readFileSync(pathl.dirname(callsite()[0].getFileName()) + "/linux/asoundrc");
                fs.writeFile(asoundrcFile, asoundrcContent, (err) => {
                    if (err) {
                        Logger.err(err.message);
                    } else {
                        Logger.info(".asoundrc file successfully created");
                    }
                });
            }
        }

        if (botConfiguration && botConfiguration.outputVolume && os.platform() === "linux") {
            // Increase volume as specified in configuration
            this.installationManager.executeCommand("amixer sset PCM,0 " + botConfiguration.outputVolume + "%", false, (error, stdout, stderr) => {
                if (error) {
                    Logger.err(error.message);
                }

                if (stderr) {
                    Logger.err(stderr);
                }
            });
        }

        webServices.registerAPI(this, WebServices.POST, ":" + ROUTE_BOT_VOCAL + "[status*]/", Authentication.AUTH_USAGE_LEVEL);
    }

    /**
     * Play the detection sound
     */
    playDetectionSound() {
        this.playSound(path.resolve("./res/sounds/dong.wav"));
    }

    /**
     * Play the end detection sound
     */
    playEndDetectionSound() {
        this.playSound(path.resolve("./res/sounds/ding.wav"));
    }

    /**
     * Play a sound
     *
     * @param  {string} soundPath The sound's file path
     */
    playSound(soundPath) {
        if (!process.env.TEST) {
            var audio = new audiohub({player: "mplayer"});
            audio.play(soundPath);
        }
    }

    /**
     * Start vocie detection
     */
    voiceDetect() {
        /*const models = new snowboy.Models();
        const self = this;
        let gBuffer = null;
        let recording = false;
        let maxSilence = 4;
        let silentCount = 0;

        models.add({
            file: path.resolve("./res/snowboy/" + this.translateManager.t("bot.pmdl")),
            sensitivity: this.botConfiguration.sensitivity.toString(),
            hotwords : this.translateManager.t("bot.hotword")
        });

        this.detector = new snowboy.Detector({
            resource: path.resolve("./res/snowboy/common.res"),
            models: models,
            audioGain: parseFloat(this.botConfiguration.audioGain)
        });

        this.detector.on("silence", function () {
            if (recording) {
                silentCount++;
            }
            if (gBuffer && gBuffer.length && recording && silentCount >= maxSilence) {
                Logger.info("End of voice detection.");

                try {
                    gBuffer = Buffer.concat([header(16000 * gBuffer.length, {
                        sampleRate: 16000,
                        channels: 1,
                        bitDepth: 16
                    }), gBuffer]);

                    const gstream = new stream.PassThrough();
                    gstream.end(gBuffer);
                    self.speechToText(gstream);
                    self.playEndDetectionSound();
                } catch(e) {
                    Logger.err(e.message);
                }

                gBuffer = null;
                recording = false;
            }
        });

        this.detector.on("sound", function (buffer) {
            if (recording) {
                if (gBuffer) {
                    gBuffer = Buffer.concat([gBuffer, buffer]);
                } else {
                    gBuffer = buffer;
                }
            }
            silentCount = 0;
        });

        this.detector.on("error", function (err) {
            Logger.err("An error has occured while snowboy is listening");
            Logger.err(err.message);
        });

        this.detector.on("hotword", function (index, hotword) {
            if (!recording) {
                Logger.info("Hotword detected : " + hotword);
                self.playDetectionSound();
                recording = true;
            }
        });

        this.mic = record.start({
            threshold: 0,
            verbose: false
        });

        this.mic.pipe(this.detector);*/
        this.registerTile();
    }

    /**
     * Register dashboard's tile to enable / disable voice recognition
     */
    registerTile() {
        const tile = new Tile.class(this.themeManager, "voice-command", Tile.TILE_GENERIC_ACTION_STATUS, this.enableVocalCommands?"F130":"F131", null, this.translateManager.t("bot.mic.dashboard"), null, null, null, this.enableVocalCommands, 10500, ROUTE_BOT_VOCAL);
        this.dashboardManager.registerTile(tile);
    }

    /**
     * Speech some text
     *
     * @param  {string} text A text
     */
    textToSpeech(text) {
        const gtts = require("node-gtts")(this.translateManager.t("bot.tts.lng"));
        const ttsTmpFilepath = this.appConfiguration.cachePath + "tts";
        if (!process.env.TEST) {
            gtts.save(ttsTmpFilepath, text, function() {
                var audio = new audiohub({player: "mplayer"});
                audio.play(ttsTmpFilepath);
            });
        }
    }

    /**
     * Convert an audio file to a text
     *
     * @param  {stream} stream  The audio stream
     */
    speechToText(stream) {
        // The content-type for this audio stream (audio/wav, ...)
        const content_type = "audio/wav";
        //this.encodeMp3(stream);

        // fs.writeFileSync("/Users/smizrahi/Desktop/test.wav", stream);
        //
        const self = this;

        // Its best to return a promise
        const parseSpeech =  new Promise((resolve, reject) => {
            // call the wit.ai api with the created stream
            WitSpeech.extractSpeechIntent(self.translateManager.t("wit.ai.api.key"), stream, content_type,
            (err, res) => {
                //Logger.err(err);
                if (err) return reject(err);
                resolve(res);
            });
        });

        // check in the promise for the completion of call to witai
        parseSpeech.then((data) => {
            //(data.entities && data.entities.greetings && data.entities.greetings.length > 0)?self.textToSpeech(data.entities.greetings[0].value):self.textToSpeech(data._text); // eslint-disable-line no-underscore-dangle
            self.onMessageReceived({message:data._text}, (feedback) => { // eslint-disable-line no-underscore-dangle
                self.textToSpeech(feedback);
            });
        })
        .catch((err) => {
            Logger.err(err);
            self.textToSpeech(self.translateManager.t("wit.ai.service.error"));
        });
    }

    /**
     * Callback when a new message is received
     *
     * @param  {Object} message A message
     * @param  {Function} botCb A callback that should be called when data processing is done
     */
    onMessageReceived(message, botCb) {
        const self = this;
        // const sessionId = sha256(DateUtils.class.timestamp().toString()).substr(0, 35);

        const client = new Wit({
            accessToken: self.translateManager.t("wit.ai.api.key")
        });

        client.message(message.message, {})
        .then((data) => {
            Logger.info("Received Wit.ai informations : " + JSON.stringify(data));
            if (data && data.entities && Object.keys(data.entities).length > 0) {
                let maxEntityConfidence = 0;
                let maxEntity = null;
                let maxEntityKey = null;
                Object.keys(data.entities).forEach((entityKey) => {
                    data.entities[entityKey].forEach((entity) => {
                        if (entity.confidence > maxEntityConfidence) {
                            maxEntityConfidence = entity.confidence;
                            maxEntity = entity;
                            maxEntityKey = entityKey;
                        }
                    });
                });

                // Entity found (unique)
                if (maxEntity && maxEntityKey) {
                    if (this.botActions[maxEntityKey]) {
                        // Bot action exists
                        this.botActions[maxEntityKey](maxEntityKey, maxEntity.value, maxEntity.type, maxEntity.confidence, message.sender, (feedback) => {
                            self.messageManager.sendMessage([message.sender], feedback);
                            if (botCb) botCb(feedback);
                        });
                    } else {
                        // Else not exist, read the default value
                        self.messageManager.sendMessage([message.sender], maxEntity.value);
                        if (botCb) botCb(maxEntity.value);
                    }

                } else {
                    self.messageManager.sendMessage([message.sender], self.translateManager.t("bot.misunderstand"));
                    if (botCb) botCb(self.translateManager.t("bot.misunderstand"));
                }
            } else {
                self.messageManager.sendMessage([message.sender], self.translateManager.t("bot.misunderstand"));
                if (botCb) botCb(self.translateManager.t("bot.misunderstand"));
            }

            Logger.warn(JSON.stringify(data));
        })
        .catch((err) => {
            if (err && err.message) Logger.err(err.message);
            if (botCb) botCb(self.translateManager.t("bot.misunderstand"));
        });
    }

    /**
     * Register a bot action
     *
     * @param  {string}   actionKey The action key
     * @param  {Function} cb        The callback to implement : `(action, value, type, confidence, sender, cb) => {cb("Job done !");}`
     */
    registerBotAction(actionKey, cb) {
        this.botActions[actionKey] = cb;
    }

    /**
     * Unregister a bot action
     *
     * @param  {string}   actionKey The action key
     */
    unregisterBotAction(actionKey) {
        delete this.botActions[actionKey];
    }

    /**
     * Return library to compare strings
     *
     * @returns {StringSimilarity} The string similarity library
     */
    stringSimilarity() {
        return StringSimilarity;
    }

    /**
     * Enable or disable voice commands. Can throw an error.
     *
     * @param  {boolean} enable `true` to enable voice command, `false` otherwise. If null, switch status automatically.
     */
    switchVocalCommands(enable) {
        if (enable === null || typeof enable === "undefined") {
            this.enableVocalCommands = !this.enableVocalCommands;
        } else {
            this.enableVocalCommands = enable;
        }

        if (this.enableVocalCommands && this.mic) {
            Logger.info("Voice command enabled");
            this.voiceDetect();
        } else if (!this.enableVocalCommands && this.mic) {
            Logger.info("Voice command disabled");
            this.mic.pause();
            record.stop();

        } else {
            Logger.err(ERROR_MIC_IS_NOT_DEFINED);
            throw Error(ERROR_MIC_IS_NOT_DEFINED);
        }

        this.registerTile();
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        const self = this;
        if (apiRequest.route.startsWith( ":" + ROUTE_BOT_VOCAL)) {
            return new Promise((resolve, reject) => {
                try {
                    self.switchVocalCommands();
                    resolve(new APIResponse.class(true, {success:true}));
                } catch(e) {
                    reject(new APIResponse.class(false, {}, 6528, ERROR_MIC_IS_NOT_DEFINED));
                }
            });
        }
    }
}

module.exports = {class:BotEngine};
