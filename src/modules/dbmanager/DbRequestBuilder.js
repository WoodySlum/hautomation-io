"use strict";
const Logger = require("../../logger/Logger");

const FIELD_ID = "id";
const FIELD_ID_META = {"type" : "int", "version" : "0.0.0"};
const FIELD_TIMESTAMP = "timestamp";
const FIELD_TIMESTAMP_META = {"type" : "timestamp", "version" : "0.0.0"};

const EQ = "=";
const LT = "<";
const GT = ">";
const LTE = "<=";
const GTE = ">=";
const LIKE = "LIKE";

const ASC = "ASC";
const DESC = "DESC";

const AVG = "AVG";
const SUM = "SUM";
const MIN = "MIN";
const MAX = "MAX";
const COUNT = "COUNT";

/**
 * DBRequest builder class
 * @class
 */
class DbRequestBuilder {
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
    }

    /**
     * Remove last comma of parameter
     *
     * @param  {string} sql A SQL request
     * @return {string}     Result
     */
    removeLastComma(sql) {
        return sql.replace(/,\s*$/, "");
    }

    /**
     * Escape SQL special characters
     *
     * @param  {string} val Input
     * @return {string}     Escaped output
     */
    escapeString(val) {
      val = val.replace(/[\0\n\r\b\t\\'"\x1a]/g, function (s) {
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
          case '"':
            return '""';
          default:
            return "\\" + s;
        }
      });

      return val;
    }

    getValueEncapsulated(value, meta) {
        if (value && (meta.type === "int" || meta.type === "float" || meta.type === "double" || meta.type === "timestamp")) {
            return value;
        } else if (value && (meta.type === "date" || meta.type === "datetime" || meta.type === "string")) {
            return "'" + this.escapeString(value) + "'";
        }

        return 'null';
    }

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

    get(obj) {
        let fields = [];
        let values = [];
        Object.keys(obj).forEach((field) => {
            // where
            this.where(field, EQ, obj[field]);
        });
        this.select();
        return this;
    }

    del(obj) {
        let fields = [];
        let values = [];
        Object.keys(obj).forEach((field) => {
            // where
            this.where(field, EQ, obj[field]);
        });
        this.remove();
        return this;
    }

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

    selectOp(operator, field, alias = null) {
        let meta = this.getMetaForField(field);
        if (meta || (field === FIELD_ID) || (field === FIELD_TIMESTAMP)) {
            if (alias) {
                this.selectList.push(operator + "(" + field + ") AS " + alias);
            } else {
                this.selectList.push(operator + "(" + field + ") AS " + field);
            }
        }
        return this;
    }

    select(...fields) {
        if (!fields || fields.length === 0) {
            this.selectList.push("*");
        } else {
            fields.forEach((field) => {
                let meta = this.getMetaForField(field);
                if (meta || (field === FIELD_ID) || (field === FIELD_TIMESTAMP)) {
                    this.selectList.push(field);
                }
            });
        }
        return this;
    }

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

    update(...fields) {
        if (!fields || fields.length === 0) {
            this.updateList.push(FIELD_ID);
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

    remove() {
        this.delete = true;
        return this;
    }

    values(...values) {
        if (values || values.length > 0) {
            values.forEach((value) => {
                this.valuesList.push(value);
            });
        }
        return this;
    }

    where(field, operator, value) {
        this.whereList.push(field + " " + operator + " " + this.getValueEncapsulated(value, this.getMetaForField(field)));
        return this;
    }

    complexWhere(clause) {
        this.whereList.push(clause);
        return this;
    }

    groupOp(operator, field) {
        this.groupList.push(operator + "(" + field +")");
        return this;
    }

    group(...fields) {
        fields.forEach((field) => {
            this.groupList.push(field);
        });
        return this;
    }

    order(operator, field) {
        this.orderList.push(field + " " + operator);
        return this;
    }

    lim(start, length) {
        this.limit = [];
        this.limit.push(start);
        this.limit.push(length);
        return this;
    }

    first(length) {
        this.limit = [];
        this.limit.push(0);
        this.limit.push(length);
        return this;
    }

    cleanForSelect() {
        if (this.selectList.length === 0) {
            this.select();
        }
        this.insertList = [];
        this.updateList = [];
        return this;
    }

    cleanForDelete() {
        this.remove();
        this.sleectist = [];
        this.insertList = [];
        this.updateList = [];
        return this;
    }

    request() {
        let req = "";
        // Select
        if (this.selectList.length > 0) {
            req += "SELECT ";
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
                req += this.getValueEncapsulated(value, this.getMetaForField(this.insertList[i])) + ",";
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
                } else {
                    req += field + "=" + this.getValueEncapsulated(this.valuesList[i], this.getMetaForField(field)) + ",";
                }

                i++;
            });
            req += FIELD_TIMESTAMP + EQ + " current_timestamp,";
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
    LT:LT,
    GT:GT,
    LTE:LTE,
    GTE:GTE,
    LIKE:LIKE,
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
