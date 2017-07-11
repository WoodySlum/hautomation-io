"use strict";
const moment = require("moment");

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

module.exports = {class:DateUtils};
