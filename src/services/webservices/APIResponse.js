"use strict";

const JSON_CONTENT_TYPE = "application/json";

/**
 * This class is a POJO representing an APIResponse item
 * @class
 */
class APIResponse {
    /**
     * Constructor
     *
     * @param  {boolean} [success=false]     Set to true if API success, else false
     * @param  {Object}  [response={}]       A response object to transmit (optional)
     * @param  {int}  [errorCode=-1]         The error code (optional)
     * @param  {string}  [errorMessage=null] The error message (optional)
     * @param  {boolean}  [upToDate=false] True will return 304 no content.
     * @param  {string}  [contentType="application/json"] The content type
     * @returns {APIResponse}                 The instance
     */
    constructor(success = false, response = {}, errorCode = -1, errorMessage = null, upToDate = false, contentType = JSON_CONTENT_TYPE) {
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
        this.upToDate = upToDate;
        this.contentType = contentType;
    }

}

module.exports = {class:APIResponse, JSON_CONTENT_TYPE:JSON_CONTENT_TYPE};
