"use strict";

const DateUtils = require("./../../utils/DateUtils");

const FIELD_ID = "id";
const FIELD_ID_META = {"type" : "int", "version" : "0.0.0"};
const FIELD_TIMESTAMP = "timestamp";
const FIELD_TIMESTAMP_META = {"type" : "timestamp", "version" : "0.0.0"};

const EQ = "=";
const NEQ = "!=";
const LT = "<";
const GT = ">";
const LTE = "<=";
const GTE = ">=";
const LIKE = "LIKE";
const NLIKE = "NOT LIKE";

const ASC = "ASC";
const DESC = "DESC";

const AVG = "AVG";
const SUM = "SUM";
const MIN = "MIN";
const MAX = "MAX";
const COUNT = "COUNT";

/**
 * DBRequest builder class
 * This class generates a SQL query from parameters, but does NOT check that SQL query is valid. Does not throw any error / exception.
 * @class
 */
class DbRequestBuilder {
    /**
     * Constructor
     *
     * @param  {string} table  Database table
     * @param  {Object} schema A JSON Database schema
     * @returns {DbRequestBuilder}        The instance
     */
    constructor(table, schema) {
        this.table = table;
        this.metas = schema[this.table];
        this.selectList = [];
        this.insertList = [];
        this.updateList = [];
        this.valuesList = [];
        this.whereList = [];
        this.groupList = [];
        this.orderList = [];
        this.delete = false;
        this.limit = [];
        this.distinctEnabled = false;
    }

    /**
     * Remove last comma of parameter
     *
     * @param  {string} sql A SQL request
     * @returns {string}     Result
     */
    removeLastComma(sql) {
        return sql.replace(/,\s*$/, "");
    }

    /**
     * Escape SQL special characters
     *
     * @param  {string} val Input
     * @returns {string}     Escaped output
     */
    escapeString(val) {
        if (val && typeof val === "string") {
            val = val.replace(/[\0\n\r\b\t\\'\x1a]/g, function (s) { // eslint-disable-line no-control-regex
                switch (s) {
                case "\0":
                    return "\\0";
                case "\n":
                    return "\\n";
                case "\r":
                    return "\\r";
                case "\b":
                    return "\\b";
                case "\t":
                    return "\\t";
                case "\x1a":
                    return "\\Z";
                case "'":
                    return "''";
                // case '"': // eslint-disable-line quotes
                //     return '""'; // eslint-disable-line quotes
                default:
                    return "\\" + s;
                }
            });
        }
        return val;
    }

    /**
     * Encapsulate data. For example, if field is a string << L'envie >>, returns << 'L''envie' >> depending on field type
     *
     * @param  {*} value A value
     * @param  {Object} meta  The field meta data from schema
     * @returns {string}       The encapsulated value
     */
    getValueEncapsulated(value, meta) {
        if (meta) {

            if (!(value === null || value === "") && (meta.type === "number" || meta.type === "int" || meta.type === "float" || meta.type === "double" || meta.type === "timestamp")) {
                return value;
            } else if (value && (meta.type === "date" || meta.type === "datetime" || meta.type === "string")) {
                return "'" + this.escapeString(value) + "'";
            }

            return "null";
        } else {
            return value;
        }
    }

    /**
     * Internal, get meta data from shcema for a specific field
     *
     * @param  {string} field A field
     * @returns {Object}       Metadata for field, null if nothing match
     */
    getMetaForField(field) {
        let meta = null;
        if (field === FIELD_ID) {
            meta = FIELD_ID_META;
        } else if (field === FIELD_TIMESTAMP) {
            meta = FIELD_TIMESTAMP_META;
        } else {
            this.metas.forEach((m) => {
                let keys = Object.keys(m);
                if (keys.length == 1 && keys[0] == field) {
                    meta = m[field];
                }
            });
        }

        return meta;
    }

    /**
     * Create a request for saving an object
     *
     * @param  {Object} obj An object with some values inside in relation with the database schema
     * @returns {DbRequestBuilder}     The instance
     */
    save(obj) {
        let fields = [];
        let values = [];
        Object.keys(obj).forEach((field) => {
            fields.push(field);
            values.push(obj[field]);
        });

        this.upsert(...fields);
        this.values(...values);
        return this;
    }

    /**
     * Create a request with the exact object content and returns from database
     * The execution of the request will return an object matching the object contents
     *
     * @param  {Object} obj An object with some values inside in relation with the database schema
     * @returns {DbRequestBuilder}     The instance
     */
    get(obj) {
        Object.keys(obj).forEach((field) => {
            // where
            this.where(field, EQ, obj[field]);
        });
        this.select();
        return this;
    }

    /**
     * Create a request with the exact object content
     * The execution of the request will delete an object matching the object contents
     *
     * @param  {Object} obj An object with some values inside in relation with the database schema
     * @returns {DbRequestBuilder}     The instance
     */
    del(obj) {
        Object.keys(obj).forEach((field) => {
            // where
            this.where(field, EQ, obj[field]);
        });
        this.remove();
        return this;
    }

    /**
     * Add select operator closure
     * Used when need to aggregate some data from database. In the obejcts results, a property alias will be added
     * Given example : `.selectOp(COUNT, "id", "total")`
     * Request example : `SELECT operator(field) as alias`
     *
     * @param  {string} operator     An operator, (exported constants) : `AVG`, `SUM`, `MIN`, `MAX` or `COUNT`
     * @param  {string} field        The field to aggregate
     * @param  {string} [alias=null] An alias for request result. If not provided, will be set into field name
     * @returns {DbRequestBuilder}     The instance
     */
    selectOp(operator, field, alias = null) {
        let meta = this.getMetaForField(field);
        if (meta || (field === FIELD_ID) || (field === FIELD_TIMESTAMP)) {
            if (alias) {
                this.selectList.push(operator + "(" + field + ") AS " + alias);
            } else {
                this.selectList.push(operator + "(" + field + ") AS " + field);
            }
        }
        return this;
    }

    /**
     * Add select closure
     * If no parameters passed, will provide all fields (`*`) request
     * Given example : `.select("id", "timestamp") or .select()`
     *
     * @param  {...string} fields     Aa list of fields, or nothing if need all fields
     * @returns {DbRequestBuilder}     The instance
     */
    select(...fields) {
        if (!fields || fields.length === 0) {
            this.selectList.push("*");
        } else {
            fields.forEach((field) => {
                this.selectList.push(field);
            });
        }
        return this;
    }

    /**
     * Add insert closure
     * If this method is called, you need to call also `.values(...)` on this object
     * If no parameters passed, will provide all fields from schema request
     * Given example : `.insert("id", "timestamp") or .insert()`
     *
     * @param  {...string} fields     Aa list of fields, or nothing if need all fields
     * @returns {DbRequestBuilder}     The instance
     */
    insert(...fields) {
        if (!fields || fields.length === 0) {
            this.metas.forEach((field) => {
                this.insertList.push(Object.keys(field)[0]);
            });
        } else {
            fields.forEach((field) => {
                let meta = this.getMetaForField(field);
                if (meta) {
                    this.insertList.push(field);
                }
            });
        }
        return this;
    }

    /**
     * Add update closure
     * If this method is called, you need to call also `.values(...)` on this object
     * If no parameters passed, will provide all fields from schema request
     * Given example : `.update("timestamp") or .update()`
     *
     * @param  {...string} fields     Aa list of fields, or nothing if need all fields
     * @returns {DbRequestBuilder}     The instance
     */
    update(...fields) {
        if (!fields || fields.length === 0) {
            this.metas.forEach((field) => {
                this.updateList.push(Object.keys(field)[0]);
            });
        } else {
            fields.forEach((field) => {
                let meta = this.getMetaForField(field);
                if (meta) {
                    this.updateList.push(field);
                }
            });
        }
        return this;
    }

    /**
     * Add upsert (update or insert) closure
     * If this method is called, you need to call also `.values(...)` on this object
     * If no parameters passed, will provide all fields from schema request
     * The update is processed if there is the `id` field into fields list.
     * Given example : `.upsert("timestamp") or .upsert()`
     *
     * @param  {...string} fields     Aa list of fields, or nothing if need all fields
     * @returns {DbRequestBuilder}     The instance
     */
    upsert(...fields) {
        if (!fields || fields.length === 0) {
            fields = [FIELD_ID];
            this.metas.forEach((field) => {
                fields.push(Object.keys(field)[0]);
            });
        }

        if (fields.indexOf(FIELD_ID) > -1) {
            this.update(...fields);
        } else {
            this.insert(...fields);
        }
        return this;
    }

    /**
     * Add delete closure
     * Usually needs to be combinated with `.where()`
     *
     * @returns {DbRequestBuilder}     The instance
     */
    remove() {
        this.delete = true;
        return this;
    }

    /**
     * Add values in combination with `insert`, `update` or `upsert` closures
     * /!\ Remember that the number of values in arguments should be exactly the same, in the same order than fields passed in `insert`, `update` or `upsert`
     * Given example : `.upsert("myText").values("foobar").where("id", EQ, 5)`
     *
     * @param  {...string} values     A list of values
     * @returns {DbRequestBuilder}     The instance
     */
    values(...values) {
        if (values || values.length > 0) {
            values.forEach((value) => {
                this.valuesList.push(value);
            });
        }
        return this;
    }

    /**
     * Add a where closure
     * Used when need to aggregate some data from database. In the obejcts results, a property alias will be added
     * Default concatenation will be `AND`, to use `OR, try `.complexWhere()` method
     * Given example : `.select().where("id", EQ, 5)`
     *
     * @param  {string} field        The field to aggregate
     * @param  {string} operator     An operator, (exported constants) : `EQ`, `NEQ`, `LT`, `GT`, `LTE`, `GTE`, `LIKE` or `NLIKE`
     * @param  {*} [value]           A value
     * @returns {DbRequestBuilder}     The instance
     */
    where(field, operator, value) {
        const meta = this.getMetaForField(field);
        if (meta && meta.type === "timestamp" && field === FIELD_TIMESTAMP) {
            this.whereList.push("CAST(strftime('%s', " + field + ") AS NUMERIC) " + operator + " " + this.getValueEncapsulated(value, meta));
        } else {
            this.whereList.push(field + " " + operator + " " + this.getValueEncapsulated(value, meta));
        }

        return this;
    }

    /**
     * Add a complex WHERE clause
     *
     * @param  {string} clause A WHERE SQL query part
     * @returns {DbRequestBuilder}     The instance
     */
    complexWhere(clause) {
        this.whereList.push(clause);
        return this;
    }

    /**
     * Add a group by operation closure
     * Given example : `.select().where("id", EQ, 5).groupOp(AVG, "value")`
     *
     * @param  {string} operator        An operator can be (exported constants) : `AVG`, `SUM`, `MIN`, `MAX` or `COUNT`
     * @param  {string} field           A field
     * @returns {DbRequestBuilder}     The instance
     */
    groupOp(operator, field) {
        this.groupList.push(operator + "(" + field +")");
        return this;
    }

    /**
     * Add a group by closure
     * Given example : `.select().where("id", EQ, 5).groupOp("value")`
     *
     * @param  {...string} fields       A  list of fields
     * @returns {DbRequestBuilder}     The instance
     */
    group(...fields) {
        fields.forEach((field) => {
            this.groupList.push(field);
        });
        return this;
    }

    /**
     * Add a order by closure
     * Given example : `.select().order(DESC, "id")`
     *
     * @param  {string} operator        An operator can be (exported constants) : `ASC` or `DESC`
     * @param  {string} field           A field
     * @returns {DbRequestBuilder}     The instance
     */
    order(operator, field) {
        this.orderList.push(field + " " + operator);
        return this;
    }

    /**
     * Add a limit closure
     * Will retrieve results from `start` to `start + length`
     *
     * @param  {int} start  The start index
     * @param  {int} length The number of database items to retrieve
     * @returns {DbRequestBuilder}     The instance
     */
    lim(start, length) {
        this.limit = [];
        this.limit.push(start);
        this.limit.push(length);
        return this;
    }

    /**
     * Will return the first `length` results
     *
     * @param  {int} [length=1] The number of database items to retrieve from the start
     * @returns {DbRequestBuilder}     The instance
     */
    first(length = 1) {
        this.limit = [];
        this.limit.push(0);
        this.limit.push(length);
        return this;
    }

    /**
     * Internal. Clean query for select
     * Used when a query is passed as parameter before triggering database execution.
     * For example, passing some where filters
     *
     * @returns {DbRequestBuilder}     The instance
     */
    cleanForSelect() {
        if (this.selectList.length === 0) {
            this.select();
        }
        this.insertList = [];
        this.updateList = [];
        return this;
    }

    /**
     * De-duplicate values
     *
     * @returns {DbRequestBuilder}     The instance
     */
    distinct() {
        this.distinctEnabled = true;
        return this;
    }

    /**
     * Internal. Clean query for delete
     * Used when a query is passed as parameter before triggering database execution.
     * For example, passing some where filters
     *
     * @returns {DbRequestBuilder}     The instance
     */
    cleanForDelete() {
        this.remove();
        this.selectList = [];
        this.insertList = [];
        this.updateList = [];
        return this;
    }

    /**
     * Generate SQL request
     *
     * @returns {string} The SQL query
     */
    request() {
        let req = "";
        // Select
        if (this.selectList.length > 0) {
            req += "SELECT ";
            if (this.distinctEnabled) {
                req += "DISTINCT ";
            }
            this.selectList.forEach((field) => {
                req += field + ",";
            });
            req = this.removeLastComma(req);
            req += " FROM `" + this.table + "`";
        }
        // Insert
        if (this.insertList.length > 0 && this.insertList.length === this.valuesList.length) {
            req += "INSERT INTO `" + this.table + "` (";
            this.insertList.forEach((field) => {
                req += field + ",";
            });
            req = this.removeLastComma(req);
            req += ") VALUES (";
            let i = 0;
            this.valuesList.forEach((value) => {
                if (this.insertList[i] === FIELD_TIMESTAMP && this.getMetaForField(this.insertList[i]).type === "timestamp") {
                    const tsValue = this.getValueEncapsulated(value, this.getMetaForField(this.insertList[i]));
                    req += parseInt(tsValue)?"datetime(" + parseInt(tsValue) + ", 'unixepoch'),":tsValue + ",";
                } else {
                    req += this.getValueEncapsulated(value, this.getMetaForField(this.insertList[i])) + ",";
                }
                i++;
            });
            req = this.removeLastComma(req);
            req += ")";
        }
        // Update
        if (this.updateList.length > 0 && this.updateList.length === this.valuesList.length) {
            req += "UPDATE `" + this.table + "` SET ";
            let i = 0;
            this.updateList.forEach((field) => {

                if (field === FIELD_ID) {
                    // Add to where clause
                    this.whereList.push(FIELD_ID + EQ + this.valuesList[i]);
                } if (field === FIELD_TIMESTAMP) {
                    if (!this.valuesList[i]) {
                        req += FIELD_TIMESTAMP + "=" + this.getValueEncapsulated(DateUtils.class.timestamp(), this.getMetaForField(field)) + ",";
                    } else {
                        const tsValue = this.getValueEncapsulated(this.valuesList[i], this.getMetaForField(field));
                        req += FIELD_TIMESTAMP + "=" + (parseInt(tsValue)?"datetime(" + parseInt(tsValue) + ", 'unixepoch')":tsValue) + ",";
                    }
                } else {
                    req += field + "=" + this.getValueEncapsulated(this.valuesList[i], this.getMetaForField(field)) + ",";
                }

                i++;
            });
            //req += FIELD_TIMESTAMP + EQ + "current_timestamp,";
            req = this.removeLastComma(req);
        }
        // Delete
        if (this.delete) {
            req += "DELETE FROM `" + this.table +"`";
        }
        // Where
        if (this.whereList.length > 0) {
            req += " WHERE 1=1";
            this.whereList.forEach((clause) => {
                req += " AND " + clause;
            });
        }
        // Group by
        if (this.groupList.length > 0) {
            req += " GROUP BY ";
            this.groupList.forEach((clause) => {
                req += clause + ",";
            });
            req = this.removeLastComma(req);
        }
        // Order by
        if (this.orderList.length > 0) {
            req += " ORDER BY ";
            this.orderList.forEach((clause) => {
                req += clause + ",";
            });
            req = this.removeLastComma(req);
        }
        // limit
        if (this.limit.length == 2) {
            req += " LIMIT " + this.limit[0] + "," + this.limit[1];
        }
        req += ";";

        return req;
    }
}

module.exports = {class:DbRequestBuilder,
    EQ:EQ,
    NEQ:NEQ,
    LT:LT,
    GT:GT,
    LTE:LTE,
    GTE:GTE,
    LIKE:LIKE,
    NLIKE:NLIKE,
    ASC:ASC,
    DESC:DESC,
    AVG:AVG,
    SUM:SUM,
    MIN:MIN,
    MAX:MAX,
    COUNT:COUNT,
    FIELD_ID:FIELD_ID,
    FIELD_TIMESTAMP:FIELD_TIMESTAMP
};
