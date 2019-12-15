"use strict";
const Logger = require("../../logger/Logger");
const DbRequestBuilder = require("./DbRequestBuilder");
const sqlite3 = require("sqlite3");

const ERROR_UNKNOWN_FIELD_TYPE = "Unknown DB field type";
const ERROR_NO_FIELD_DETECTED = "No DB field detected";
const ERROR_UNKNOWN_TABLE = "Unknown DB table";
const ERROR_UNKNOWN_ID = "No id";
const ERROR_INVALID_REQUEST = "Invalid request. Provide a DbRequestBuilder object";

/**
 * Public API for database manager
 * @class
 */
class DbManager {

    /**
     * Constructor
     *
     * @param  {AppConfiguration} appConfiguration The app configuration object
     * @param  {sqlite3} [sqlite3lib=null] sqlite3lib The database library, for testing only
     * @returns {DbManager} The instance
     */
    constructor(appConfiguration, sqlite3lib = null) {
        if (sqlite3lib) { // For testing
            this.db = sqlite3lib;
        } else if (process.env.TEST) { // For testing
            this.db = new sqlite3.Database(":memory:");
        } else {
            this.db = new sqlite3.Database(appConfiguration.db);
        }
    }

    /**
     * Close database
     */
    close() {
        if (this.db) {
            this.db.close();
        }
    }

    /**
     * Return the list of fields for a schema
     *
     * @param  {string} table  A database table
     * @param  {Object} schema A database schema
     * @returns {Array}        An array of fields
     */
    getFieldsForTable(table, schema) {
        const meta = schema[table];
        let fields = [];
        if (!meta) {
            throw Error(ERROR_UNKNOWN_TABLE);
        } else {
            fields.push(DbRequestBuilder.FIELD_ID);
            fields.push(DbRequestBuilder.FIELD_TIMESTAMP);
            meta.forEach((f) => {
                const key = Object.keys(f);
                if (key.length === 1) {
                    fields.push(key[0]);
                }
            });
        }
        return fields;
    }

    /**
     * Convert version x.y.z to a numbered version
     *
     * @param  {string} v Version x.y.z
     * @returns {int}   Version
     */
    numberVersion(v) {
        let n = 0;
        const ev = v.split(".");
        if (ev[2]) {
            n += parseInt(ev[2]);
        }

        if (ev[1]) {
            n += 1000 * parseInt(ev[1]);
        }

        if (ev[0]) {
            n += 1000000 * parseInt(ev[0]);
        }

        return n;
    }

    /**
     * Create or upgrade a database schema passed in parameter
     * The oldVersion parameter should be set as string for the module database
     * Can throw ERROR_NO_FIELD_DETECTED if no fields in database schema
     *
     * @param  {Object} schema     A database schema
     * @param  {string} oldVersion A version like x.y.z
     * @param  {Function} [cb=null] Callback of type `(error) => {}`. Error is null if no errors
     */
    initSchema(schema, oldVersion, cb = null) {
        if (schema) {
            const tables = Object.keys(schema);
            let error = null;
            this.db.serialize(() => {
                // Create table request
                tables.forEach((table) => {
                    // Create table if exists
                    this.db.get("SELECT * FROM SQLITE_MASTER WHERE tbl_name = ?", table, (err, res) => {
                        if (!res) {
                            // Create table
                            // Header + primary key
                            let sql = "CREATE TABLE IF NOT EXISTS `" + table + "` (";
                            sql += "`" + this.Operators().FIELD_ID + "` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,";
                            sql += "`" + this.Operators().FIELD_TIMESTAMP + "` TIMESTAMP NOT NULL DEFAULT current_timestamp,";
                            // Fields
                            schema[table].forEach((fieldMeta) => {
                                const fields = Object.keys(fieldMeta);
                                if (fields.length === 1) {
                                    const field = fields[0];
                                    const meta = fieldMeta[field];
                                    try {
                                        sql += this.getDbFieldType(field, meta);
                                    } catch(e) {
                                        error = e;
                                    }
                                } else {
                                    error = Error(ERROR_NO_FIELD_DETECTED);
                                }
                            });
                            // Footer
                            sql = this.RequestBuilder(table, schema).removeLastComma(sql);
                            sql += ");";
                            Logger.verbose(sql);

                            // Execute query
                            if (!err) {
                                this.db.run(sql);
                            }

                            if (cb) {
                                cb(error);
                            }
                        } else {
                            // Migrate table if needed
                            schema[table].forEach((fieldMeta) => {
                                const fields = Object.keys(fieldMeta);
                                if (fields.length === 1) {
                                    const field = fields[0];
                                    const meta = fieldMeta[field];
                                    if (Object.keys(meta).length === 0) {
                                        error = Error(ERROR_NO_FIELD_DETECTED);
                                    } else {
                                        if (this.numberVersion(meta.version) > this.numberVersion(oldVersion)) {
                                            //let sqlRemove = "ALTER TABLE `" + table + "` DROP COLUMN `" + field + "`;"
                                            //Logger.verbose(sqlRemove);
                                            //this.db.run(sqlRemove);
                                            try {
                                                let sqlAdd = "ALTER TABLE `" + table + "` ADD " + this.getDbFieldType(field, fieldMeta[field]);
                                                sqlAdd = this.RequestBuilder(table, schema).removeLastComma(sqlAdd);
                                                sqlAdd += ";";
                                                Logger.verbose(sqlAdd);
                                                this.db.run(sqlAdd, (err) => {
                                                    if (err) {
                                                        Logger.warn("Could not execute update field query table (" + table + ") field (" + field + ")");
                                                    }
                                                });
                                            } catch(e) {
                                                error = e;
                                            }
                                        }
                                    }
                                } else {
                                    error = Error(ERROR_NO_FIELD_DETECTED);
                                }
                            });

                            if (cb) {
                                cb(error);
                            }
                        }
                    });
                });
            });
        }
    }

    /**
     * Get database field type from table metadata
     *
     * @param  {string} field A meta field name
     * @param  {Object} meta  Meta for field
     * @returns {string}       A SQLite DB field type
     */
    getDbFieldType(field, meta) {
        let sql = "";
        if (meta.type === "int") {
            sql += "`" + field + "` BIGINT,";
        } else if (meta.type === "float") {
            sql += "`" + field + "` FLOAT,";
        } else if (meta.type === "number") {
            sql += "`" + field + "` DOUBLE,";
        } else if (meta.type === "double") {
            sql += "`" + field + "` DOUBLE,";
        } else if (meta.type === "date") {
            sql += "`" + field + "` DATE,";
        } else if (meta.type === "datetime") {
            sql += "`" + field + "` DATETIME,";
        } else if (meta.type === "timestamp") {
            sql += "`" + field + "` TIMESTAMP,";
        } else if (meta.type === "string") {
            sql += "`" + field + "` TEXT,";
        } else if (meta.type === "blob") {
            sql += "`" + field + "` BLOB,";
        } else {
            throw Error(ERROR_UNKNOWN_FIELD_TYPE);
        }

        return sql;
    }

    /**
     * Shortcut to create a DbRequestBuilder
     *
     * @param {string} table  The table for the request
     * @param {Object} schema A database schema
     *
     * @returns {DbRequestBuilder}       A request builder
     */
    RequestBuilder(table, schema) {
        return new DbRequestBuilder.class(table, schema);
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
        return DbRequestBuilder;
    }

    /**
     * Save an object in database (upsert mode)
     *
     * @param  {string} table     The table
     * @param  {Object} schema    Database schema
     * @param  {Object} object    An object macthing schema
     * @param  {Function} [cb=null] Callback of type `(error) => {}`. Error is null if no errors
     */
    saveObject(table, schema, object, cb = null) {
        const meta = schema[table];
        if (!meta) {
            if (cb) {
                cb(new Error(ERROR_UNKNOWN_TABLE));
            }
        } else {
            let sql = this.RequestBuilder(table, schema)
                .save(object)
                .request();
                
            Logger.verbose(sql);
            this.db.run(sql, (err) => {
                if (err && cb) {
                    cb(err);
                } else {
                    if (cb) {
                        cb(null);
                    }
                }
            });
        }
    }

    /**
     * Get an object from database
     *
     * @param  {string} table     The table
     * @param  {Object} schema    Database schema
     * @param  {Object} object    An object macthing schema, with values inside. Example `getObject("myTable", schema, {id:152}, (err, object) => {console.log(object);})`
     * @param  {Function} [cb=null] Callback of type `(error, object) => {}`. Error is null if no errors
     */
    getObject(table, schema, object, cb = null) {
        const meta = schema[table];
        if (!meta) {
            if (cb) {
                cb(new Error(ERROR_UNKNOWN_TABLE));
            }
        } else {
            let sql = this.RequestBuilder(table, schema)
                .get(object)
                .first(1)
                .request();
            Logger.verbose(sql);
            this.db.get(sql, (err, res) => {
                if (err && cb) {
                    cb(err, null);
                } else {
                    if (cb) {
                        cb(null, res);
                    }
                }
            });
        }
    }

    /**
     * Get an objects from database
     *
     * @param  {string} table     The table
     * @param  {Object} schema    Database schema
     * @param  {DbRequestBuilder} request    A request with the desired parameters. For example `RequestBuilder("history", schema).where("value", GT, 32)`
     * @param  {Function} [cb=null] Callback of type `(error, objects) => {}`. Error is null if no errors
     */
    getObjects(table, schema, request, cb = null) {
        const meta = schema[table];
        if (!meta) {
            if (cb) {
                cb(new Error(ERROR_UNKNOWN_TABLE));
            }
        } else {
            if (request instanceof DbRequestBuilder.class) {
                let sql = request
                    .cleanForSelect()
                    .request();
                Logger.verbose(sql);
                this.db.all(sql, (err, res) => {
                    if (err && cb) {
                        cb(err, null);
                    } else {
                        if (cb) {
                            cb(null, res);
                        }
                    }
                });
            } else {
                if (cb) {
                    cb(new Error(ERROR_INVALID_REQUEST));
                }
            }

        }
    }

    /**
     * Get the last object from database (by timestamp)
     *
     * @param  {string} table     The table
     * @param  {Object} schema    Database schema
     * @param  {Function} [cb=null] Callback of type `(error, object) => {}`. Error is null if no errors
     */
    getLastObject(table, schema, cb = null) {
        const meta = schema[table];
        if (!meta) {
            if (cb) {
                cb(new Error(ERROR_UNKNOWN_TABLE));
            }
        } else {
            let sql = this.RequestBuilder(table, schema)
                .select()
                .order(this.Operators().DESC, this.Operators().FIELD_TIMESTAMP)
                .first(1)
                .request();
            Logger.verbose(sql);
            this.db.get(sql, (err, res) => {
                if (err && cb) {
                    cb(err, null);
                } else {
                    if (cb) {
                        cb(null, res);
                    }
                }
            });
        }
    }

    /**
     * Delete an object from database
     *
     * @param  {string} table     The table
     * @param  {Object} schema    Database schema
     * @param  {Object} object    An object macthing schema, with values inside. Example `getObject("myTable", schema, {id:152}, (err) => {})`
     * @param  {Function} [cb=null] Callback of type `(error) => {}`. Error is null if no errors
     */
    delObject(table, schema, object, cb = null) {
        const meta = schema[table];
        if (!meta) {
            if (cb) {
                cb(new Error(ERROR_UNKNOWN_TABLE));
            }
        } else {
            let sql = this.RequestBuilder(table, schema)
                .del(object)
                .request();
            Logger.verbose(sql);
            this.db.run(sql, (err) => {
                if (err && cb) {
                    cb(err);
                } else {
                    if (cb) {
                        cb(null);
                    }
                }
            });
        }
    }

    /**
     * Delete objects from database
     *
     * @param  {string} table     The table
     * @param  {Object} schema    Database schema
     * @param  {DbRequestBuilder} request    A request with the desired parameters. For example `RequestBuilder("history", schema).where("value", GT, 32)`
     * @param  {Function} [cb=null] Callback of type `(error) => {}`. Error is null if no errors
     */
    delObjects(table, schema, request, cb = null) {
        const meta = schema[table];
        if (!meta) {
            if (cb) {
                cb(new Error(ERROR_UNKNOWN_TABLE));
            }
        } else {
            let sql = request
                .cleanForDelete()
                .request();
            Logger.verbose(sql);
            this.db.run(sql, (err) => {
                if (err && cb) {
                    cb(err);
                } else {
                    if (cb) {
                        cb(null);
                    }
                }
            });
        }
    }

}

module.exports = {class:DbManager,
    ERROR_UNKNOWN_FIELD_TYPE:ERROR_UNKNOWN_FIELD_TYPE,
    ERROR_NO_FIELD_DETECTED:ERROR_NO_FIELD_DETECTED,
    ERROR_UNKNOWN_TABLE:ERROR_UNKNOWN_TABLE,
    ERROR_UNKNOWN_ID:ERROR_UNKNOWN_ID,
    ERROR_INVALID_REQUEST:ERROR_INVALID_REQUEST
};
