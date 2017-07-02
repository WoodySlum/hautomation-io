"use strict";

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
}

module.exports = {class:DateUtils};
