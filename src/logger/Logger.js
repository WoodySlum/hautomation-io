"use strict";

const stackTrace = require("stack-trace");
const dateTime = require("node-datetime");
const columnify = require("columnify");
const disableLog = parseInt(process.env.NO_LOG);
let logLevel = 3;

const enableLogLevel = true;
const enableFileName = true;
const enableFunction = true;
const enableLine = true;
const MAX_LOG_HISTORY_SIZE = 500;
const logHistory = [];


/**
 * This class provides static methods to log into a file.
 * @class
 */
class Logger {
    /**
     * Set the log level
     *
     * @param {number} [level=3] Log level between 0 and 5
     */
    static setLogLevel(level = 3) {
        if (level != null && typeof level != "undefined") {
            logLevel = level;
        }
    }

    /**
     * Log to a file
     *
     * @param  {string} message   A log message
     * @param  {int} [level=3] Log level between 0 to 5
     * @param  {[string]} params    Some parameters
     */
    static log(message, level = 3, ...params) {
        if (disableLog != 1) {
            if (message instanceof Object) {
                message = JSON.stringify(message);
            }

            const fullStack = stackTrace.get();
            const stack = fullStack[2];

            let logLine = {};
            let logLineConfig = {showHeaders:false, config:{}};

            // Time
            logLine.date = dateTime.create().format("Y-m-d H:M:S.N");
            logLineConfig.config.date = {minWidth: 23, maxWidth: 23, truncate: true};

            // Log level
            if (enableLogLevel) {
                switch(level) {
                case 0:
                    logLine.level = "\x1b[46m\x1b[30m[FORCED]\x1b[0m";
                    break;
                case 1:
                    logLine.level = "\x1b[41m\x1b[37m[ERROR]\x1b[0m";
                    break;
                case 2:
                    logLine.level = "\x1b[43m\x1b[30m[WARN]\x1b[0m";
                    break;
                case 3:
                    logLine.level = "\x1b[46m\x1b[30m[INFO]\x1b[0m";
                    break;
                case 4:
                    logLine.level = "\x1b[47m\x1b[30m[VERBOSE]\x1b[0m";
                    break;
                case 5:
                    logLine.level = "\x1b[47m\x1b[30m[DEBUG]\x1b[0m";
                    break;
                }
                logLineConfig.config.level = {minWidth: 9};
            }

            // File name
            if (enableFileName) {
                if (stack && stack.getFileName()) {
                    const explodedFileName = stack.getFileName().split("/");
                    if (stack.getFileName().indexOf("plugins") > 0) {
                        logLine.fileName = "\x1b[35m" + explodedFileName[(explodedFileName.length - 2)].replace(".js", "") + "/" + explodedFileName[(explodedFileName.length - 1)].replace(".js", "") + "\x1b[0m";
                    } else {
                        logLine.fileName = "\x1b[35m" + explodedFileName[(explodedFileName.length - 1)].replace(".js", "") + "\x1b[0m";
                    }
                } else {
                    logLine.fileName = "\x1b[35mProcess\x1b[0m";
                }
                logLineConfig.config.fileName = {minWidth: 20, maxWidth: 20, truncate: true};
            }

            // Function
            if (enableFunction) {
                logLine.function = "\x1b[32m" + stack.getFunctionName() + "\x1b[0m";
                logLineConfig.config.function = {minWidth: 20, maxWidth: 20, truncate: true};
            }

            // Line
            if (enableLine) {
                logLine.lineNumber = "\x1b[32ml." + stack.getLineNumber() + "\x1b[0m";
                logLineConfig.config.lineNumber = {minWidth: 5, maxWidth: 6};
            }

            // Message
            logLine.message = message;
            logLineConfig.config.message = {preserveNewLines: true};

            if (level >= 5) {
                logLine.message += "\n" + fullStack.splice(2).join("\n");
            }
            //logLineConfig.config.lineNumber = {maxWidth: 50};

            if (level <= logLevel) {
                const log = columnify([logLine], logLineConfig);
                logHistory.unshift({
                    date: Date.now(),
                    stringDate:logLine.date,
                    level:level,
                    stringLevel: this.removeColors(logLine.level),
                    message:message,
                    filename: logLine.fileName ? this.removeColors(logLine.fileName) : null,
                    function: logLine.function ? this.removeColors(logLine.function) : null,
                    line: logLine.lineNumber ? this.removeColors(logLine.lineNumber).replace("l.", "") : null
                });
                if (logHistory.length > MAX_LOG_HISTORY_SIZE) {
                    logHistory.splice(-1, 1);
                }

                console.log(log, ...params);
            }
        }
    }

    /**
     * Remove console colors from a string
     *
     * @param  {string} entry A text entry
     *
     * @returns {string}       Output string without colors
     */
    static removeColors(entry) {
        const regex = /\[[0-9]+m/gm;
        return entry.replace(regex, "");
    }

    /**
     * Log a log to a file
     *
     * @param  {string} message   A log message
     * @param  {[string]} params    Some parameters
     */
    static flog(message, ...params) {
        this.log(message, 0, ...params);
    }

    /**
     * Log a warning to a file
     *
     * @param  {string} message   A log message
     * @param  {[string]} params    Some parameters
     */
    static warn(message, ...params) {
        this.log(message, 2, ...params);
    }

    /**
     * Log an error to a file
     *
     * @param  {string} message   A log message
     * @param  {[string]} params    Some parameters
     */
    static err(message, ...params) {
        this.log(message, 1, ...params);
    }

    /**
     * Log a verbose message to a file
     *
     * @param  {string} message   A log message
     * @param  {[string]} params    Some parameters
     */
    static verbose(message, ...params) {
        this.log(message, 4, ...params);
    }

    /**
     * Log an information to a file
     *
     * @param  {string} message   A log message
     * @param  {[string]} params    Some parameters
     */
    static info(message, ...params) {
        this.log(message, 3, ...params);
    }

    /**
     * Log a debug message to a file, with stacktrace
     *
     * @param  {string} message   A log message
     * @param  {[string]} params    Some parameters
     */
    static debug(message, ...params) {
        this.log(message, 5, ...params);
    }

    /**
     * Get the log history
     *
     * @returns {Array} An array of logs
     */
    static getHistory() {
        return logHistory;
    }
}

module.exports = Logger;
