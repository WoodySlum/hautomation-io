"use strict";

const stackTrace = require("stack-trace");
const dateTime = require("node-datetime");
const columnify = require("columnify");

const enableLogLevel = true;
const enableFileName = true;
const enableFunction = true;
const enableLine = true;

/**
 * This class provides static methods to log into a file.
 * @class
 */
class Logger {
    /**
     * Log to a file
     *
     * @param  {string} message   A log message
     * @param  {int} [level=3] Log level between 0 to 5
     */
    static log(message, level = 3) {
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
            case 1:
            case 2:
                logLine.level = "\x1b[41m\x1b[37m[ERROR]\x1b[0m";
                break;
            case 3:
                logLine.level = "\x1b[43m\x1b[30m[WARN]\x1b[0m";
                break;
            case 4:
                logLine.level = "\x1b[46m\x1b[30m[INFO]\x1b[0m";
                break;
            case 5:
                logLine.level = "\x1b[47m\x1b[30m[VERBOSE]\x1b[0m";
                break;
            }
            logLineConfig.config.level = {minWidth: 9};
        }

        // File name
        if (enableFileName) {
            const explodedFileName = stack.getFileName().split("/");
            logLine.fileName = "\x1b[35m" + explodedFileName[(explodedFileName.length - 1)].replace(".js", "") + "\x1b[0m";
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
            logLineConfig.config.lineNumber = {minWidth: 5, maxWidth: 5};
        }

        // Message
        logLine.message = message;
        //logLineConfig.config.lineNumber = {maxWidth: 50};

        console.log(columnify([logLine], logLineConfig));
    }

    /**
     * Log a warning to a file
     *
     * @param  {string} message   A log message
     */
    static warn(message) {
        this.log(message, 3);
    }

    /**
     * Log an error to a file
     *
     * @param  {string} message   A log message
     */
    static err(message) {
        this.log(message, 2);
    }

    /**
     * Log a verbose message to a file
     *
     * @param  {string} message   A log message
     */
    static verbose(message) {
        this.log(message, 5);
    }

    /**
     * Log an information to a file
     *
     * @param  {string} message   A log message
     */
    static info(message) {
        this.log(message, 4);
    }
}

module.exports = Logger;
