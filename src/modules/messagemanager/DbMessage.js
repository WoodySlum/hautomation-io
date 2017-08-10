const DbObject = require("./../dbmanager/DbObject");

/**
 * This class is used for messages database
 * @class
 */
class DbMessage extends DbObject.class {
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
         * @Property("recipient");
         * @Type("string");
         * @Version("0.0.0");
         */
        this.recipient;

        /**
         * @Property("sender");
         * @Type("string");
         * @Version("0.0.0");
         */
        this.sender;

        /**
         * @Property("message");
         * @Type("string");
         * @Version("0.0.0");
         */
        this.message;

        /**
         * @Property("action");
         * @Type("string");
         * @Version("0.0.0");
         */
        this.action;

        /**
         * @Property("link");
         * @Type("string");
         * @Version("0.0.0");
         */
        this.link;

        /**
         * @Property("picture");
         * @Type("string");
         * @Version("0.0.0");
         */
        this.picture;
    }
}

module.exports = {class:DbMessage};
