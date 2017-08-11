"use strict";
const moment = require("moment");
const ROUND_TIMESTAMP_MINUTE = 0;
const ROUND_TIMESTAMP_HOUR = 1;
const ROUND_TIMESTAMP_DAY = 2;
const ROUND_TIMESTAMP_MONTH = 3;

/**
 * Utility class for dates
 * @class
 */
class DateUtils {
    /**
     * Return the current timestamp
     *
     * @returns {number} The current timestamp
     */
    static timestamp() {
        return Math.floor((Date.now() / 1000) | 0);
    }

    /**
     * Convert a string date time zoned to UTC timestamp
     *
     * @param  {string} date The GMT date
     * @returns {number}      The UTC timestamp
     */
    static dateToUTCTimestamp(date) {
        return moment(moment(date).utc().format("YYYY-MM-DD HH:mm:ss")).unix();
    }

    /**
     * Convert a string date time zoned to timestamp
     *
     * @param  {string} date The GMT date
     * @returns {number}      The GMT timestamp
     */
    static dateToTimestamp(date) {
        return moment(date+"Z").unix();
    }

    /**
     * Round the timestamp to the mode
     *
     * @param  {number} timestamp A timestamp
     * @param  {number} mode      The mode (contant : `DateUtils.ROUND_TIMESTAMP_MINUTE`, `DateUtils.ROUND_TIMESTAMP_HOUR`, `DateUtils.ROUND_TIMESTAMP_DAY`, `DateUtils.ROUND_TIMESTAMP_MONTH`)
     * @returns {number}          Rounded timestamp
     */
    static roundedTimestamp(timestamp, mode) {
        let date = moment.unix(timestamp).utc();

        switch(mode) {
        case ROUND_TIMESTAMP_MINUTE:
            date = moment(date.format("YYYY-MM-DD HH:mm:00Z"));
            break;
        case ROUND_TIMESTAMP_HOUR:
            date = moment(date.format("YYYY-MM-DD HH:00:00Z"));
            break;
        case ROUND_TIMESTAMP_DAY:
            date = moment(date.format("YYYY-MM-DD 00:00:00Z"));
            break;
        case ROUND_TIMESTAMP_MONTH:
            date = moment(date).format("YYYY-MM-01 00:00:00Z");
            break;
        }

        return moment(date).unix();
    }

    /**
     * Format the current date with parameter
     *
     * @param  {string} format      A format (Y for year, m for month, d for day, H for hour, i for minutes, s for seconds)
     * @param  {number} [timestamp=null] A timestamp. If not provided, use current timestamp.
     * @returns {string}             The formatted date
     */
    static dateFormatted(format, timestamp = null) {
        if (!timestamp) {
            timestamp = this.timestamp();
        }
        const date = new Date(timestamp * 1000);

        return moment(date).format(format);
    }
}

module.exports = {class:DateUtils, ROUND_TIMESTAMP_MINUTE:ROUND_TIMESTAMP_MINUTE, ROUND_TIMESTAMP_HOUR:ROUND_TIMESTAMP_HOUR, ROUND_TIMESTAMP_DAY:ROUND_TIMESTAMP_DAY, ROUND_TIMESTAMP_MONTH:ROUND_TIMESTAMP_MONTH};
