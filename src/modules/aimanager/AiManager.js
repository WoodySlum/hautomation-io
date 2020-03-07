"use strict";

const bayes = require("bayes");
const cv = require("opencv4nodejs");
const fs = require("fs");
const Logger = require("./../../logger/Logger");
const DateUtils = require("./../../utils/DateUtils");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");

const ERROR_NO_CLASSIFIER = "No classifier registered";
const DB_FILE_EXTENSION = ".ai";
const CLASS_DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const CLASS_MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const CLASS_DAYOFF = ["workon", "workoff"];
const CLASS_DAYNIGHT = ["day", "night"];
const CLASS_TIME = "time";


/**
 * This class is used for artificial intelligence and machine learning
 * @class
 */
class AiManager {
    /**
     * Constructor
     *
     * @param  {string} configurationPath The configuration path
     * @param  {EventEmitter} eventBus    The global event bus
     * @param  {string} stopEventName    The stop event name
     * @param  {TimeEventService} timeEventService    The time event service
     * @param  {EnvironmentManager} environmentManager    The environment manager
     *
     * @returns {AiManager} The instance
     */
    constructor(configurationPath, eventBus, stopEventName, timeEventService, environmentManager) {
        this.databaseFile = configurationPath + "data" + DB_FILE_EXTENSION;
        this.timeEventService = timeEventService;
        this.environmentManager = environmentManager;
        this.classifiers = {};

        // Computer vision
        this.cvMap = null;
        this.cvProtoTxt = null;
        this.cvModelFile = null;
        this.cvNet = null;
        this.initCv();

        try {
            const serializedData = JSON.parse(fs.readFileSync(this.databaseFile));
            Object.keys(serializedData).forEach((key) => {
                this.classifiers[key] = bayes.fromJson(serializedData[key]);
                this.classifiers[key].tokenizer = this.tokenizer;
            });
        } catch(e) {
            Logger.warn(e.message);
        }


        // Save classifiers on stop core
        const self = this;
        if (eventBus) {
            eventBus.on(stopEventName, () => {
                self.saveClassifiers();
            });
        }

        this.timeEventService.register(() => {
            self.saveClassifiers();
        }, this, TimeEventService.EVERY_HOURS_INACCURATE);
    }

    /**
     * Init computer vision (called in constructor)
     */
    initCv() {
        this.cvMap = JSON.parse(fs.readFileSync("./res/ai/model/map.json"));
        const cvProtoTxt = "./res/ai/model/deploy.prototxt.txt";
        const cvModelFile = "./res/ai/model/deploy.caffemodel";
        this.cvNet = cv.readNetFromCaffe(cvProtoTxt, cvModelFile);
        cv.setNumThreads(4);
    }

    /**
     * Learn data to ai engine
     *
     * @param  {string} key A key
     * @param  {string|Array} data    The data
     * @param  {string} classification    The classification
     *
     * @returns {Promise} The promise
     */
    learn(key, data, classification) {
        if (this.classifiers[key]) {
            return this.classifiers[key].learn(data, classification);
        } else {
            throw Error(ERROR_NO_CLASSIFIER + " " + key);
        }
    }

    /**
     * Learn time data to ai engine
     *
     * @param  {string} key A key
     * @param  {Array} data    The data
     * @param  {string} classification    The classification
     *
     * @returns {Promise} The promise
     */
    learnWithTime(key, data, classification) {
        const timestamp = DateUtils.class.timestamp();
        const date = new Date(DateUtils.class.dateFormatted("YYYY-MM-DD HH:mm:ss", timestamp));

        data.push(CLASS_DAYS[date.getDay()]);

        data.push(CLASS_MONTHS[date.getMonth()]);
        if (this.environmentManager.getCoordinates() && this.environmentManager.getCountry()) {
            data.push(CLASS_DAYOFF[(DateUtils.class.isHoliday(this.environmentManager.getCountry(), timestamp) ? 0 : 1)]);
        }
        data.push(CLASS_DAYNIGHT[(this.environmentManager.isNight() ? 1 : 0)]);
        data.push(this.environmentManager.getSeason(timestamp));
        data.push(CLASS_TIME + date.getHours());

        return this.learn(key, data, classification);
    }

    /**
     * Guess the classification
     *
     * @param  {string} key A key
     * @param  {string|Array} data    The data
     *
     * @returns {Promise} The promise with the classification
     */
    guess(key, data) {
        if (this.classifiers[key]) {
            return this.classifiers[key].categorize(data);
        } else {
            throw Error(ERROR_NO_CLASSIFIER + " " + key);
        }
    }

    /**
     * Guess time data to ai engine
     *
     * @param  {string} key A key
     * @param  {Array} data    The data
     * @param  {number} timestamp    The desired timestamp
     *
     * @returns {Promise} The promise
     */
    guessWithTime(key, data, timestamp) {
        const date = new Date(DateUtils.class.dateFormatted("YYYY-MM-DD HH:mm:ss", timestamp));

        data.push(CLASS_DAYS[date.getDay()]);

        data.push(CLASS_MONTHS[date.getMonth()]);
        if (this.environmentManager.getCoordinates() && this.environmentManager.getCountry()) {
            data.push(CLASS_DAYOFF[(DateUtils.class.isHoliday(this.environmentManager.getCountry(), timestamp) ? 0 : 1)]);
        }

        data.push(this.environmentManager.getSeason(timestamp));
        data.push(CLASS_TIME + date.getHours());

        return this.guess(key, data);
    }

    /**
     * Register
     *
     * @param  {string} key A key
     * @param  {Function} [tokenizer=null]    A tokenizer function. If not provided, default tokenizer.
     */
    register(key, tokenizer = null) {
        if (!this.classifiers[key]) {
            this.classifiers[key] = bayes({
                tokenizer: (tokenizer ? tokenizer : this.tokenizer)
            });

        } else if (tokenizer) {
            this.classifiers[key].tokenizer = tokenizer;
        }
    }

    /**
     * Unregister. Thus will destroy the learned data.
     * /!\ THIS WILL DELETE HISTORY DATA !
     *
     * @param  {string} key A key
     */
    unregister(key) {
        delete this.classifiers[key];
    }

    /**
     * Tokenizer
     *
     * @param  {string|Array} data    The data
     */
    tokenizer(data) {
        if (Array.isArray(data)) {
            const d = [];
            data.forEach((token) => {
                d.push(token.toString());
            });
            return d;
        } else {
            return data.split(" ");
        }
    }


    /**
     * Save classifiers
     */
    saveClassifiers() {
        const json = {};
        Object.keys(this.classifiers).forEach((key) => {
            json[key] = this.classifiers[key].toJson();
        });
        fs.writeFileSync(this.databaseFile, JSON.stringify(json));
    }

    /**
     * Process neuronal artificial recognition on image
     *
     * @param  {Buffer} img An image
     *
     * @returns {Promise} The promise with a 2 properties object resolve - `results` and `frame`
     */
    processCvSsd(img) {
        const self = this;
        return new Promise((resolve, reject) => {
            let tFrame = null;
            cv.imdecodeAsync(img)
                .then(frame => {
                    tFrame = frame;
                    return cv.blobFromImageAsync(frame.resizeToMax(300), 0.007843, new cv.Size(300, 300), new cv.Vec3(127.5, 0, 0));
                })
                .then(inputBlob => self.cvNet.setInputAsync(inputBlob))
                .then(() => self.cvNet.forwardAsync())
                .then(outputBlob => {
                    outputBlob.flattenFloat(outputBlob.sizes[2], outputBlob.sizes[3]);
                    outputBlob = outputBlob.flattenFloat(outputBlob.sizes[2], outputBlob.sizes[3]);

                    const results = Array(outputBlob.rows)
                        .fill(0)
                        .map((res, i) => {
                            const classLabel = outputBlob.at(i, 1);
                            const confidence = outputBlob.at(i, 2);
                            const bottomLeft = new cv.Point(
                                outputBlob.at(i, 3) * tFrame.cols,
                                outputBlob.at(i, 6) * tFrame.rows
                            );
                            const topRight = new cv.Point(
                                outputBlob.at(i, 5) * tFrame.cols,
                                outputBlob.at(i, 4) * tFrame.rows
                            );
                            const rect = new cv.Rect(
                                bottomLeft.x,
                                topRight.y,
                                topRight.x - bottomLeft.x,
                                bottomLeft.y - topRight.y
                            );

                            return ({
                                classLabel,
                                confidence,
                                rect
                            });
                        })
                        .filter((item) => {
                            return item.confidence > 0;
                        });

                    resolve({results: results, frame: tFrame});
                })
                .catch((e) => {
                    Logger.err(e);
                    reject(e);
                });
        });
    }

    /**
     * Surround elements on picture
     *
     * @param  {Array} results The `processCvSsd` results
     * @param  {Mat} frame The cv initial mat
     *
     * @returns {Buffer} The JPG image
     */
    drawCvRectangles(results, frame) {
        for (let i = 0 ; i < results.length ; i++) {
            frame.drawRectangle(
                results[i].rect,
                new cv.Vec(0, 255, 0),
                2,
                cv.LINE_8
            );
            cv.drawTextBox(
                frame,
                { x: results[i].rect.x, y: results[i].rect.y },
                [{ text: this.cvMap.mapper[results[i].classLabel] + " - " + parseInt(results[i].confidence * 100) + "%", fontSize: 0.5, thickness: 1, color: new cv.Vec(0, 255, 0) }],
                0.6
            );
        }

        return cv.imencode('.jpg', frame);
    }
}

module.exports = {class:AiManager, ERROR_NO_CLASSIFIER:ERROR_NO_CLASSIFIER, DB_FILE_EXTENSION:DB_FILE_EXTENSION};
