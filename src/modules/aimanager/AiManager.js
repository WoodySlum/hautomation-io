"use strict";

const bayes = require("bayes");
const fs = require("fs");
const path = require("path");
const cv = require("opencv4nodejs");
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

        // const image = cv.imread("1581774480.JPG");
        // const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALCATFACE);
        // const { objects, numDetections } = classifier.detectMultiScale(image.bgrToGray());
        //
        // console.log('faceRects:', objects);
        // console.log('confidences:', numDetections);
        // // process.exit(0);
        //
        // const drawRect = (image, rect, color, opts = { thickness: 2 }) =>
        //   image.drawRectangle(
        //     rect,
        //     color,
        //     opts.thickness,
        //     cv.LINE_8
        //   );
        //  const drawBlueRect = (image, rect, opts = { thickness: 2 }) => drawRect(image, rect, new cv.Vec(255, 0, 0), opts);
        // const numDetectionsTh = 10;
        // objects.forEach((rect, i) => {
        //     // if (numDetections[i] > 20) {
        //         const thickness = 3;//numDetections[i] < numDetectionsTh ? 1 : 2;
        //         drawBlueRect(image, rect, { thickness });
        //     // }
        //
        // });
        // // cv.imshowWait('face detection', image);
        // cv.imwrite("mat.png", image);

        const grabFrames = (videoFile, delay, onFrame) => {
  const cap = new cv.VideoCapture(videoFile);
  let done = false;
  const intvl = setInterval(() => {
    let frame = cap.read();
    // loop back to start on end of stream reached
    if (frame.empty) {
      cap.reset();
      frame = cap.read();
    }
    onFrame(frame);

    const key = cv.waitKey(delay);
    done = key !== -1 && key !== 255;
    if (done) {
      clearInterval(intvl);
      console.log('Key pressed, exiting.');
    }
  }, 0);
};

    const drawRectAroundBlobs = (binaryImg, dstImg, minPxSize, fixedRectWidth) => {
  const {
    centroids,
    stats
  } = binaryImg.connectedComponentsWithStats();
let detected = 0;
  // pretend label 0 is background
  for (let label = 1; label < centroids.rows; label += 1) {
    const [x1, y1] = [stats.at(label, cv.CC_STAT_LEFT), stats.at(label, cv.CC_STAT_TOP)];
    const [x2, y2] = [
      x1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_WIDTH)),
      y1 + (fixedRectWidth || stats.at(label, cv.CC_STAT_HEIGHT))
    ];
    const size = stats.at(label, cv.CC_STAT_AREA);
    const blue = new cv.Vec(255, 0, 0);
    if (minPxSize < size) {
        detected++;
      dstImg.drawRectangle(
        new cv.Point(x1, y1),
        new cv.Point(x2, y2),
        { color: blue, thickness: 2 }
      );
    }
  }
  return detected;
};

        const bgSubtractor = new cv.BackgroundSubtractorMOG2();
        const delay = 300;
        grabFrames('https://webcam1.lpl.org/axis-cgi/mjpg/video.cgi', delay, (frame) => {
            const foreGroundMask = bgSubtractor.apply(frame);

            const iterations = 5;
            const dilated = foreGroundMask.dilate(
              cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(4, 4)),
              new cv.Point(-1, -1),
              iterations
            );
            const blurred = dilated.blur(new cv.Size(10, 10));
            const thresholded = blurred.threshold(200, 255, cv.THRESH_BINARY);

            const minPxSize = 10000;
            let detected = drawRectAroundBlobs(thresholded, frame, minPxSize);
            if (detected > 1) {
                console.log(detected);
            }


            cv.imshow('foreGroundMask', foreGroundMask);
            cv.imshow('thresholded', thresholded);
            cv.imshow('frame', frame);
          cv.imwrite("mona-mat.png", frame);
        });

        // process.exit(0);
        // cv.imwrite("/Users/smizrahi/Downloads/mona-mat.png", mat);
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


}

module.exports = {class:AiManager, ERROR_NO_CLASSIFIER:ERROR_NO_CLASSIFIER, DB_FILE_EXTENSION:DB_FILE_EXTENSION};
