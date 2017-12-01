"use strict";
const Logger = require("./../../logger/Logger");
// const sha256 = require("sha256");
// const DateUtils = require("./../../utils/DateUtils");

const record = require("node-record-lpcm16");
const snowboy = require("snowboy");
const header = require("waveheader");
const stream = require("stream");
const WitSpeech = require("node-witai-speech");
const {Wit} = require("node-wit");
const audiohub = require("audiohub");
const path = require("path");

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
     * @returns {BotEngine} The instance
     */
    constructor(appConfiguration, translateManager, messageManager, botConfiguration) {
        this.messageManager = messageManager;
        this.translateManager = translateManager;
        this.messageManager.register(this);
        this.botConfiguration = botConfiguration;
        this.appConfiguration = appConfiguration;

        // Bot actions
        this.botActions = {};
        if (!process.env.TEST) {
            this.voiceDetect();
        }
    }

    /**
     * Play the detection sound
     */
    playDetectionSound() {
        if (!process.env.TEST) {
            var audio = new audiohub();
            audio.play(path.resolve("./res/sounds/dong.wav"));
        }
    }

    /**
     * Play the end detection sound
     */
    playEndDetectionSound() {
        if (!process.env.TEST) {
            var audio = new audiohub();
            audio.play(path.resolve("./res/sounds/ding.wav"));
        }
    }

    /**
     * Start vocie detection
     */
    voiceDetect() {
        const models = new snowboy.Models();
        const self = this;
        let gBuffer = null;
        let recording = false;
        let maxSilence = 2;
        let silentCount = 0;

        models.add({
            file: path.resolve("./res/snowboy/" + this.translateManager.t("bot.pmdl")),
            sensitivity: this.botConfiguration.sensitivity.toString(),
            hotwords : this.translateManager.t("bot.hotword")
        });

        const detector = new snowboy.Detector({
            resource: path.resolve("./res/snowboy/common.res"),
            models: models,
            audioGain: parseFloat(this.botConfiguration.audioGain)
        });

        detector.on("silence", function () {
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

        detector.on("sound", function (buffer) {
            if (recording) {
                if (gBuffer) {
                    gBuffer = Buffer.concat([gBuffer, buffer]);
                } else {
                    gBuffer = buffer;
                }
            }
            silentCount = 0;
        });

        detector.on("error", function () {
            Logger.err("An error has occured while snowboy is listening");
        });

        detector.on("hotword", function (index, hotword) {
            if (!recording) {
                Logger.info("Hotword detected : " + hotword);
                self.playDetectionSound();
                recording = true;
            }
        });

        const mic = record.start({
            threshold: 0,
            verbose: false
        });

        mic.pipe(detector);
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
                var audio = new audiohub();
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
            Logger.err(err.message);
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

}

module.exports = {class:BotEngine};
