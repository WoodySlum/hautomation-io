"use strict";
var DbObject = require("./../../modules/dbmanager/DbObject");

/**
 * Database object and schema for scheduler
 * @class
 */
class SchedulerDbObject extends DbObject.class {
    /**
     * Constructor
     *
     * @param  {DbHelper} [dbHelper=null] A DbHelper object mapping
     * @param  {...Object} values          The values
     * @returns {SchedulerDbObject}                 The instance
     */
    constructor(dbHelper = null, ...values) {
        super(dbHelper, ...values);

        /**
         * @Property("identifier");
         * @Type("string");
         * @Version("0.0.0");
         */
        this.identifier;

        /**
         * @Property("data");
         * @Type("string");
         * @Version("0.0.0");
         */
        this.data;

        /**
         * @Property("triggerDate");
         * @Type("timestamp");
         * @Version("0.0.0");
         */
        this.triggerDate;

        /**
         * @Property("triggered");
         * @Type("int");
         * @Version("0.0.0");
         */
        this.triggered;
    }
}

module.exports = {class:SchedulerDbObject};
