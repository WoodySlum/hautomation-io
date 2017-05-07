"use strict";

class APIResponse {

    constructor(success = false, response = {}, errorCode = -1, errorMessage = null) {
        /**
         * Success
         * @type {bool} sucess True if no errors
         */
        this.success = success;
        /**
         * Response
         * @type {Object} response The response object serialized in JSON
         */
        this.response = response;
        /**
         * Error code
         * @type {int} errorCode The error code
         */
        this.errorCode = errorCode;
        /**
         * The error message
         * @type {string} errorMessage The error message
         */
        this.errorMessage = errorMessage;
    }

}

module.exports = {class:APIResponse};
