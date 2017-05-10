"use strict";

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

        console.log("[" + level + "]    " + message);
    }

    /**
     * Log a warning to a file
     *
     * @param  {string} message   A log message
     */
    static warn(message) {
        this.log(message);
    }

    /**
     * Log an error to a file
     *
     * @param  {string} message   A log message
     */
    static err(message) {
        this.log(message);
    }

    /**
     * Log a verbose message to a file
     *
     * @param  {string} message   A log message
     */
    static verbose(message) {
        this.log(message);
    }

    /**
     * Log an information to a file
     * 
     * @param  {string} message   A log message
     */
    static info(message) {
        this.log(message);
    }
}

module.exports = Logger;
