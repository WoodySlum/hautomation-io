/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

const DbSchemaConverter = require("./../../../src/modules/dbmanager/DbSchemaConverter");
const DbObject = require("./../../../src/modules/dbmanager/DbObject");

class FooBar extends DbObject.class {
    constructor(dbHelper = null, ...values) {
        super(dbHelper, ...values);

        /**
         * @Property("foo");
         * @Type("string");
         * @Version("0.0.0");
         */
        this.foo;

        /**
         * @Property("bar");
         * @Type("int");
         * @Version("0.0.0");
         */
        this.bar;

        /**
         * @Property("foobar");
         * @Type("int");
         */
        this.foobar;
    }
}

const result = {"foobar":[{"foo":{"type":"string","version":"0.0.0"}},{"bar":{"type":"int","version":"0.0.0"}}]};

describe("DbSchemaConverter", function() {


    before(() => {

    });

    it("should return correct table name)", function() {
        expect(DbSchemaConverter.class.tableName(FooBar)).to.be.equal("foobar");
    });

    it("should generate correct db schema from annotations)", function() {
        expect(JSON.stringify(DbSchemaConverter.class.toSchema(FooBar))).to.be.equal(JSON.stringify(result));
    });

    after(function () {

    });
});
