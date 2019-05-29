const DbObject = require("./../dbmanager/DbObject");

/**
 * This class is used for devices database
 * @class
 */
class DbDevice extends DbObject.class {
    /**
     * Radio table descriptor
     *
     * @param  {DbHelper} [dbHelper=null] A database helper
     * @param  {...Object} values          The values
     * @returns {DbObject}                 A database object
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
         * @Property("status");
         * @Type("int");
         * @Version("0.0.0");
         */
        this.status;

        /**
         * @Property("brightness");
         * @Type("float");
         * @Version("0.0.0");
         */
        this.brightness;

        /**
         * @Property("color");
         * @Type("string");
         * @Version("0.0.0");
         */
        this.color;

        /**
         * @Property("temperature");
         * @Type("float");
         * @Version("0.0.0");
         */
        this.temperature;
    }
}

module.exports = {class:DbDevice};
