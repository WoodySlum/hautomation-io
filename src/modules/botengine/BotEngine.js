"use strict";
const Logger = require("./../../logger/Logger");
const apiai = require("apiai");
const sha256 = require("sha256");
const DateUtils = require("./../../utils/DateUtils");

const record = require("node-record-lpcm16");
const snowboy = require("snowboy");
const fs = require("fs");
const header = require("waveheader");
const stream = require("stream");
const WitSpeech = require("node-witai-speech");
const audiohub = require("audiohub");
const path = require("path");
const lame = require("lame");

/**
 * This class manage the Hautomation bot
 * @class
 */
class BotEngine {
    /**
     * Constructor
     *
     * @param  {TranslateManager} translateManager The translation manager
     * @param  {MessageManager} messageManager The message manager
     * @param  {Object} botConfiguration The bot configuration
     * @returns {BotEngine} The instance
     */
    constructor(translateManager, messageManager, botConfiguration) {
        this.messageManager = messageManager;
        this.translateManager = translateManager;
        this.apiai = apiai(this.translateManager.t("apiai.key"));
        this.messageManager.register(this);
        this.botConfiguration = botConfiguration;
        this.voiceDetect();
    }

    playDetectionSound() {
        var audio = new audiohub();
        audio.play(path.resolve("./res/sounds/beep.mp3"));
    }

    playEndDetectionSound() {
        var audio = new audiohub();
        audio.play(path.resolve("./res/sounds/beep6.mp3"));
    }

    voiceDetect() {
        const models = new snowboy.Models();
        const self = this;
        let gBuffer = null;
        let recording = false;
        let maxSilence = 2;
        let silentCount = 0;

        models.add({
          file: "./res/snowboy/" + this.translateManager.t("bot.pmdl"),
          sensitivity: this.botConfiguration.sensitivity.toString(),
          hotwords : this.translateManager.t("bot.hotword")
        });

        const detector = new snowboy.Detector({
              resource: "./res/snowboy/common.res",
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
                        self.speechToText(gstream, self);
                        self.playEndDetectionSound();
                    } catch(e) {

                    }

                    gBuffer = null;
                    recording = false;
                }
            });

            detector.on("sound", function (buffer) {
              // <buffer> contains the last chunk of the audio that triggers the "sound"
              // event. It could be written to a wav stream.
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

            detector.on("hotword", function (index, hotword, buffer) {
              // <buffer> contains the last chunk of the audio that triggers the "hotword"
              // event. It could be written to a wav stream. You will have to use it
              // together with the <buffer> in the "sound" event if you want to get audio
              // data after the hotword.

              if (!recording) {
                  Logger.info("Hotword detected.");
                  self.playDetectionSound();
                  recording = true;
              }
            });

            const mic = record.start({
              threshold: 0,
              verbose: true
            });

            mic.pipe(detector);
    }

    textToSpeech(text) {
        const say = require("say");
        say.speak(text);
    }

    speechToText(stream, context) {
        // The content-type for this audio stream (audio/wav, ...)
        const content_type = "audio/wav";
        fs.writeFileSync("/Users/smizrahi/Desktop/test.wav", stream);

        // Its best to return a promise
        const parseSpeech =  new Promise((resolve, reject) => {
            // call the wit.ai api with the created stream
            WitSpeech.extractSpeechIntent(context.translateManager.t("wit.ai.api.key"), stream, content_type,
            (err, res) => {
                Logger.err(err);
                if (err) return reject(err);
                resolve(res);
            });
        });

        // check in the promise for the completion of call to witai
        parseSpeech.then((data) => {
            console.log(data);
            context.textToSpeech(data._text);
        })
        .catch((err) => {
            Logger.err(err);
            context.textToSpeech(context.translateManager.t("wit.ai.service.error"));
        })
    }

    /**
     * Callback when a new message is received
     *
     * @param  {Object} message A message
     * @param  {Function} botCb A callback that should be called when data processing is done
     */
    onMessageReceived(message, botCb) {
        const self = this;
        const sessionId = sha256(DateUtils.class.timestamp().toString()).substr(0, 35);

        const request = this.apiai.textRequest(message.message, {
            sessionId: sessionId
        });

        request.on("response", function(response) {
            Logger.info(response);
            self.messageManager.sendMessage([message.sender], response.result.fulfillment.speech);
            if (botCb) botCb();
        });

        request.on("error", function(error) {
            Logger.err(error);
            if (botCb) botCb();
        });

        request.end();
    }


}

module.exports = {class:BotEngine};
