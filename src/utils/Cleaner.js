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

    /**
     * Clean a DbObject by removing DbHelper
     *
     * @param  {DbObject} dbObject A database object
     * @returns {Object}          A cleaned object
     */
    static cleanDbObject(dbObject) {
        if (dbObject && dbObject.dbHelper) {
            const tmpObject = Object.assign({}, dbObject);
            delete tmpObject.dbHelper;

            return tmpObject;
        }
        return dbObject;
    }
}

module.exports = {class:Cleaner};
