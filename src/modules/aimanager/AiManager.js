"use strict";

const bayes = require("bayes");
const fs = require("fs");
const Logger = require("./../../logger/Logger");
const DateUtils = require("./../../utils/DateUtils");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");

const ERROR_NO_CLASSIFIER = "No classifier registered";
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
        this.databaseFile = configurationPath + "data.ai";
        this.timeEventService = timeEventService;
        this.environmentManager = environmentManager;
        this.classifiers = {};

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
        if (this.environmentManager.getCoordinates()) {
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
        if (this.environmentManager.getCoordinates()) {
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
            return data;
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


}

module.exports = {class:AiManager, ERROR_NO_CLASSIFIER:ERROR_NO_CLASSIFIER};
