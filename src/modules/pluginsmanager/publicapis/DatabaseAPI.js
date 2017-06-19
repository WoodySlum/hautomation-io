"use strict";
const PrivateProperties = require("./../PrivateProperties");
const DbHelper = require("./../../dbmanager/DbHelper");

/**
 * Public API for database
 * @class
 */
class DatabaseAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {DbManager} dbManager The database manager instance
    //  * @param  {string} previousVersion The previous plugin version
    //  * @returns {DatabaseAPI}             The instance
    //  */
    constructor(dbManager, previousVersion) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).dbManager = dbManager;
        PrivateProperties.oprivate(this).previousVersion = previousVersion;
        this.registeredSchema = null;
    }
    /* eslint-enable */

    /**
     * Set database schema
     *
     * @param  {Object} schema    A database schema (read database documentation)
     * @param  {Function} [cb=null] A callback with an error in parameter : `(err) => {}``
     */
    schema(schema, cb = null) {
        this.registeredSchema = schema;
        PrivateProperties.oprivate(this).dbManager.initSchema(this.registeredSchema, PrivateProperties.oprivate(this).previousVersion, cb);
    }

    /**
     * Creates a new DbHelper object.
     * Call the `schema(...)` method before calling this one.
     * The DbHelper object allows you to create, update, delete or execute queries on the database
     *
     * @param {string} table                The table
     * @param {DbObject} [dbObjectClass=null] A database object extended class. Please read documentation
     * @returns {DbHelper}             A DbHelper object
     */
    dbHelper(table, dbObjectClass = null) {
        if (this.registeredSchema) {
            return new DbHelper.class(PrivateProperties.oprivate(this).dbManager, this.registeredSchema, table, dbObjectClass);
        } else {
            throw Error("Call schema() method first");
        }
    }
}

module.exports = {class:DatabaseAPI};
