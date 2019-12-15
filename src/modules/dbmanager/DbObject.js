"use strict";

const DbRequestBuilder = require("./DbRequestBuilder");

/**
 * Database objects
 * This class must be extended
 * @class
 */
class DbObject {
    /**
     *
     *
     * @param  {DbHelper} [dbHelper=null] A database helper object
     * @param  {...*} values          A list of values
     * @returns {DbObject}             The instance
     */
    constructor(dbHelper = null, ...values) {
        this.dbHelper = dbHelper;
        if (values && dbHelper) {
            // Passed array of values by super
            if (values.length === 1 && values instanceof Array) {
                values = values[0];
            }
            const fields = this.dbHelper.getFieldsForTable();
            // All fields are provided
            if (values.length === fields.length) {
                for (let i = 0 ; i < fields.length ; i++) {
                    this[fields[i]] = values[i];
                }
            } else if (values.length === (fields.length -2)) {
                // In this case, id and timestamp are not  (explained -2)
                this[DbRequestBuilder.FIELD_ID] = null;
                this[DbRequestBuilder.FIELD_TIMESTAMP] = null;
                for (let i = 2 ; i < fields.length ; i++) {
                    this[fields[i]] = values[i-2];
                }
            }
        }
    }

    /**
     * Creates an object cloned with only field properties
     *
     * @returns {Object} A cloned object without any methods
     */
    base() {
        let baseObj = {};
        this.dbHelper.getFieldsForTable().forEach((field) => {
            if (this[field] === null || this[field] === "") {
                baseObj[field] = null;
            } else {
                baseObj[field] = this[field];
            }
        });

        return baseObj;
    }

    /**
     * Save the database object
     *
     * @param  {Function} [cb=null] Callback of type `(error) => {}`. Error is null if no errors
     */
    save(cb = null) {
        this.dbHelper.saveObject(this.base(), cb);
    }

    /**
     * Delete the database object
     *
     * @param  {Function} [cb=null] Callback of type `(error) => {}`. Error is null if no errors
     */
    del(cb = null) {
        this.dbHelper.delObject(this.base(), cb);
    }
}

module.exports = {class:DbObject};
