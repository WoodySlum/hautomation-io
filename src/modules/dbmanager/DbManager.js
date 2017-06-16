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
     * @returns {DbManager} The instance
     */
    constructor(appConfiguration) {
        this.db = new sqlite3.Database(appConfiguration.db);

        // db.close();
        var schema = {"history":[
				{"test" : {"type" : "datetime", "version" : "0.0.1"}},
                {"test2" : {"type" : "string", "version" : "0.0.1"}},
                {"test3" : {"type" : "string", "version" : "0.0.2"}}
                ]
            };
        this.createOrUpgrade(schema, "0.0.2");

        this.saveObject("history", schema, {"test":"2012-02-01 12:34:22", "test2":"to'to", "test3":"toutou"});
        this.getObject("history", schema, {id:2}, (err, obj) => {
            Logger.log(obj);
        });
        this.saveObject("history", schema, {id:2, "test":"2012-02-01 12:34:22", "test2":"to'to", "test3":"titi"});
        this.saveObject("history", schema, {"test3":"foobar"});
        this.delObject("history", schema, {test3:"foobar"});
        this.getObjects("history", schema, this.RequestBuilder("history", schema), (err, obj) => {
            Logger.log(obj);
            Logger.log(obj.length);
        });
        this.getObjects("history", schema, this.RequestBuilder("history", schema).selectOp(this.Operators().COUNT, this.Operators().FIELD_ID, "nb").where("test3", this.Operators().LIKE, "%ti"), (err, obj) => {
            Logger.log(obj);
        });

        this.delObjects("history", schema, this.RequestBuilder("history", schema).where("test3", this.Operators().LIKE, "%ti"), (err, obj) => {
            Logger.log(obj);
        });
        this.getLastObject("history", schema, (err, obj) => {
            Logger.log(obj);
        });

        // this.delObject("history", test, {id:5}, (err, obj) => {
        //
        // });
        /*this.getObjects("history", schema, (err, obj) => {
            //console.log(obj);
        }, "test3 = 'titi'");*/
        /*Logger.err(new DbRequestBuilder.class("history", schema)
                    .select()
                    .selectOp(DbRequestBuilder.OP_SUM, "id", "toto")
                    .where("id", DbRequestBuilder.GT, 3)
                    .group("id")
                    .groupOp(DbRequestBuilder.OP_MAX, "id")
                    .order(DbRequestBuilder.DESC, "id")
                    .lim(5,10)
                    .request());
        Logger.err(new DbRequestBuilder.class("history", schema)
                    .insert()
                    .values("22", "bar", "foobar")
                    .request());
        Logger.err(new DbRequestBuilder.class("history", schema)
                    .update()
                    .values(5, "22", "bar", "foobar")
                    .where("id", DbRequestBuilder.EQ, 3)
                    .request());
        Logger.err(new DbRequestBuilder.class("history", schema)
                    .remove()
                    .where("id", DbRequestBuilder.EQ, 3)
                    .where("test", DbRequestBuilder.EQ, "foo")
                    .request());*/
        Logger.err(new DbRequestBuilder.class("history", schema)
                    .upsert("test", "test2", "test3")
                    .values("22", "bar", "foobar")
                    .request());
    }

    /**
     * Convert version x.y.z to a numbered version
     *
     * @param  {string} v Version x.y.z
     * @return {int}   Version
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

    createOrUpgrade(schema, oldVersion) {
        if (schema) {
            const tables = Object.keys(schema);
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
                                if (fields.length == 1) {
                                    const field = fields[0];
                                    const meta = fieldMeta[field];
                                    sql += this.getDbFieldType(field, meta);
                                } else {
                                    throw Error(ERROR_NO_FIELD_DETECTED);
                                }
                            });
                            // Footer
                            sql = this.removeLastComma(sql);
        					sql += ");";
                            Logger.verbose(sql);

                            // Execute query
                            this.db.run(sql);
                        } else {
                            // Migrate table if needed
                            schema[table].forEach((fieldMeta) => {
                                const fields = Object.keys(fieldMeta);
                                if (fields.length == 1) {
                                    const field = fields[0];
                                    const meta = fieldMeta[field];
                                    if (this.numberVersion(meta.version) > this.numberVersion(oldVersion)) {
                                        //let sqlRemove = "ALTER TABLE `" + table + "` DROP COLUMN `" + field + "`;"
                                        //Logger.verbose(sqlRemove);
                                        //this.db.run(sqlRemove);
                                        let sqlAdd = "ALTER TABLE `" + table + "` ADD " + this.getDbFieldType(field, fieldMeta[field]);
                                        sqlAdd = this.removeLastComma(sqlAdd);
                                        sqlAdd += ";";
                                        Logger.verbose(sqlAdd);
                                        this.db.run(sqlAdd, (err) => {
                                            if (err) {
                                                Logger.warn("Could not execute update field query table (" + table + ") field (" + field + ")");
                                            }
                                        });
                                    }
                                } else {
                                    throw Error(ERROR_NO_FIELD_DETECTED);
                                }
                            });
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
     * @return {string}       A SQLite DB field type
     */
    getDbFieldType(field, meta) {
        let sql = "";
        if (meta.type === "int") {
            sql += "`" + field + "` BIGINT,";
        } else if (meta.type === "float") {
            sql += "`" + field + "` FLOAT,";
        } else if (meta.type === "double") {
            sql += "`" + field + "` DOUBLE,";
        } else if (meta.type === "date") {
            sql += "`" + field + "` DATE,";
        } else if (meta.type === "datetime") {
            sql += "`" + field + "` DATETIME,";
        } else if (meta.type === "timestamp") {
            sql += "`" + field + "` BIGINT,";
        } else if (meta.type === "string") {
            sql += "`" + field + "` TEXT,";
        } else if (meta.type === "blob") {
            sql += "`" + field + "` BLOB,";
        } else {
            throw Error(ERROR_UNKNOWN_FIELD_TYPE);
        }

        return sql;
    }

    RequestBuilder(table, schema) {
        return new DbRequestBuilder.class(table, schema);
    }

    Operators() {
        return DbRequestBuilder;
    }

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
