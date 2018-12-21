"use strict";

const DbObject =  require("./DbObject");
const PrivateProperties = require("./../pluginsmanager/PrivateProperties");
const DateUtils = require("./../../utils/DateUtils");

/**
 * Public API for database manager
 * @class
 */
class DbHelper {
    /**
     * Encapsulate DbManager to be more easier
     *
     * @param  {DbManager} dbManager A DbManager instance
     * @param  {Object} schema    A database schema
     * @param  {string} table     A table
     * @param  {Class} [dbObjectClass=null]     A DbObject extended class. If not provided, a classic DbObject will be provided
     * @returns {DbHelper}           The instance
     */
    constructor(dbManager, schema, table, dbObjectClass = null) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).dbManager = dbManager;
        this.schema = schema;
        this.table = table;
        if (!dbObjectClass) {
            this.dbObjectClass = DbObject.class;
        } else {
            this.dbObjectClass = dbObjectClass;
        }
    }

    /**
     * Shortcut to create a DbRequestBuilder
     *
     * @returns {DbRequestBuilder}       A request builder
     */
    RequestBuilder() {
        return PrivateProperties.oprivate(this).dbManager.RequestBuilder(this.table, this.schema);
    }

    /**
     * Shortcut to access to DbRequestBuilder constants
     * Here is the list of constants :
     * EQ
     * NEQ
     * LT
     * GT
     * LTE
     * GTE
     * LIKE
     * NLIKE
     * ASC
     * DESC
     * AVG
     * SUM
     * MIN
     * MAX
     * COUNT
     * FIELD_ID
     * FIELD_TIMESTAMP
     *
     * @returns {Object}       A list of constants
     */
    Operators() {
        return PrivateProperties.oprivate(this).dbManager.Operators();
    }

    /**
     * Return the list of fields for a shema
     *
     * @returns {Array} A list of fields
     */
    getFieldsForTable() {
        return PrivateProperties.oprivate(this).dbManager.getFieldsForTable(this.table, this.schema);
    }

    /**
     * Save an object in database (upsert mode)
     *
     * @param  {Object} object    An object macthing schema
     * @param  {Function} [cb=null] Callback of type `(error) => {}`. Error is null if no errors
     */
    saveObject(object, cb = null) {
        // Remove null values for critical fields
        if (!object[this.Operators().FIELD_ID]) {
            delete object[this.Operators().FIELD_ID];
        }

        if (!object[this.Operators().FIELD_TIMESTAMP]) {
            delete object[this.Operators().FIELD_TIMESTAMP];
        } else {
            if (typeof object[this.Operators().FIELD_TIMESTAMP] == "string") {
                object[this.Operators().FIELD_TIMESTAMP] = DateUtils.class.dateToUTCTimestamp(object[this.Operators().FIELD_TIMESTAMP].replace(/"/g,"").replace(/'/g,""));
            }
        }

        PrivateProperties.oprivate(this).dbManager.saveObject(this.table, this.schema, object, cb);
    }

    /**
     * Get an object from database
     *
     * @param  {Object} object    An object macthing schema, with values inside. Example `getObject("myTable", schema, {id:152}, (err, object) => {console.log(object);})`
     * @param  {Function} [cb=null] Callback of type `(error, object) => {}`. Error is null if no errors
     */
    getObject(object, cb = null) {
        PrivateProperties.oprivate(this).dbManager.getObject(this.table, this.schema, object, (error, object) => {
            if (this.dbObjectClass) {
                if (object) {
                    // Cast object to specific object class if provided
                    let values = [];
                    const fields = this.getFieldsForTable();
                    fields.forEach((field) => {
                        if (object[field]) {
                            values.push(object[field]);
                        } else {
                            values.push(null);
                        }
                    });

                    const dbObject = new this.dbObjectClass(this, values);

                    // Additionnal fields
                    Object.keys(object).forEach((property) => {
                        if (!fields[property]) {
                            dbObject[property] = object[property];
                        }
                    });

                    // Creates a new DBobject class
                    cb(error, dbObject);
                } else {
                    cb(error, object);
                }
            } else {
                cb(error, object);
            }
        });
    }

    /**
     * Get an objects from database
     *
     * @param  {DbRequestBuilder} request    A request with the desired parameters. For example `RequestBuilder("history", schema).where("value", GT, 32)`
     * @param  {Function} [cb=null] Callback of type `(error, objects) => {}`. Error is null if no errors
     */
    getObjects(request, cb = null) {
        PrivateProperties.oprivate(this).dbManager.getObjects(this.table, this.schema, request, (error, objects) => {
            if (this.dbObjectClass) {
                let castObjects = [];
                if (objects) {
                    objects.forEach((object) => {
                        // Cast object to specific object class if provided
                        let values = [];
                        const fields = this.getFieldsForTable();
                        fields.forEach((field) => {
                            if (object[field]) {
                                values.push(object[field]);
                            } else {
                                values.push(null);
                            }
                        });

                        const dbObject = new this.dbObjectClass(this, values);

                        // Additionnal fields
                        Object.keys(object).forEach((property) => {
                            if (!fields[property]) {
                                dbObject[property] = object[property];
                            }
                        });

                        // Creates a new DbObject class
                        castObjects.push(dbObject);
                    });
                    cb(error, castObjects);
                } else {
                    cb(error, objects);
                }
            } else {
                cb(error, objects);
            }
        });
    }

    /**
     * Get the last object from database (by timestamp)
     *
     * @param  {Function} [cb=null] Callback of type `(error, object) => {}`. Error is null if no errors
     */
    getLastObject(cb = null) {
        PrivateProperties.oprivate(this).dbManager.getLastObject(this.table, this.schema, (error, object) => {
            if (this.dbObjectClass) {
                if (object) {
                    // Cast object to specific object class if provided
                    let values = [];
                    this.getFieldsForTable().forEach((field) => {
                        if (object[field]) {
                            values.push(object[field]);
                        } else {
                            values.push(null);
                        }
                    });
                    // Creates a new DBobject class
                    cb(error, new this.dbObjectClass(this, values));
                } else {
                    cb(error, object);
                }
            } else {
                cb(error, object);
            }
        });
    }

    /**
     * Delete an object from database
     *
     * @param  {Object} object    An object macthing schema, with values inside. Example `getObject("myTable", schema, {id:152}, (err) => {})`
     * @param  {Function} [cb=null] Callback of type `(error) => {}`. Error is null if no errors
     */
    delObject(object, cb = null) {
        PrivateProperties.oprivate(this).dbManager.delObject(this.table, this.schema, object, cb);
    }

    /**
     * Delete objects from database
     *
     * @param  {DbRequestBuilder} request    A request with the desired parameters. For example `RequestBuilder("history", schema).where("value", GT, 32)`
     * @param  {Function} [cb=null] Callback of type `(error) => {}`. Error is null if no errors
     */
    delObjects(request, cb = null) {
        PrivateProperties.oprivate(this).dbManager.delObjects(this.table, this.schema, request, cb);
    }
}

module.exports = {class:DbHelper};
