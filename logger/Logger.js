"use strict";

class Logger {
    static log(message, level = 3) {
        console.log("    " + message);
    }

    static warn(message) {
        this.log(message);
    }

    static err(message) {
        this.log(message);
    }

    static verbose(message) {
        this.log(message);
    }

    static info(message) {
        this.log(message);
    }
}

module.exports = Logger;
