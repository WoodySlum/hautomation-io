"use strict";

/**
 * Utility class for cleaning stuff
 * @class
 */
class Cleaner {
    /**
     * Clean an exported class by removing the `class` property
     *
     * @param  {Object} exported An exported object with `class` property
     * @returns {Object}          A clean object
     */
    static exportConstants(exported) {
        let o = Object.assign({}, exported);
        delete o.class;
        return o;
    }
}

module.exports = {class:Cleaner};
