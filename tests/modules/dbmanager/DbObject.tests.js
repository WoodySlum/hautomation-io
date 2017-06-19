/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var sqlite3 = require("sqlite3");

var DbManager = require("./../../../src/modules/dbmanager/DbManager");
var DbHelper = require("./../../../src/modules/dbmanager/DbHelper");
var DbObject = require("./../../../src/modules/dbmanager/DbObject");

describe("DbObject", function() {
    let dbManager;
    let dbHelper;
    let sqlite3ob = new sqlite3.Database(":memory:");
    const table = "foobar";
    const schema = {"foobar":[
            {"foo" : {"type" : "string", "version" : "0.0.0"}},
            {"bar" : {"type" : "int", "version" : "0.0.0"}}
        ]
    };

    before(() => {
        dbManager = new DbManager.class({db:""}, sqlite3ob);
        dbHelper = new DbHelper.class(dbManager, schema, table);
    });


    it("constructor should have correct properties (without id and timestamp)", function() {
        let dbObject = new DbObject.class(dbHelper, "bar", 200);
        expect(dbObject).to.have.property(dbHelper.Operators().FIELD_ID).and.to.be.null;
        expect(dbObject).to.have.property(dbHelper.Operators().FIELD_TIMESTAMP).and.to.be.null;
        expect(dbObject).to.have.property("foo").and.equal("bar");
        expect(dbObject).to.have.property("bar").and.equal(200);
    });

    it("constructor should have correct properties (with id and timestamp)", function() {
        let dbObject = new DbObject.class(dbHelper, 3, 1497866759, "bar", 200);
        expect(dbObject).to.have.property(dbHelper.Operators().FIELD_ID).and.equal(3);
        expect(dbObject).to.have.property(dbHelper.Operators().FIELD_TIMESTAMP).and.equal(1497866759);
        expect(dbObject).to.have.property("foo").and.equal("bar");
        expect(dbObject).to.have.property("bar").and.equal(200);
    });

    it("base should have only properties, nothing more", function() {
        const dbObject = new DbObject.class(dbHelper, 3, 1497866759, "bar", 200);
        expect(Object.keys(dbObject.base()).length).to.be.equal(4);
    });

    it("should save object", function() {
        const dbObject = new DbObject.class(dbHelper, 3, 1497866759, "bar", 200);
        sinon.spy(dbHelper, "saveObject");
        dbObject.save();
        expect(dbHelper.saveObject.calledOnce).to.be.true;
        dbHelper.saveObject.restore();
    });

    it("should delete object", function() {
        const dbObject = new DbObject.class(dbHelper, 3, 1497866759, "bar", 200);
        sinon.spy(dbHelper, "delObject");
        dbObject.del();
        expect(dbHelper.delObject.calledOnce).to.be.true;
        dbHelper.delObject.restore();
    });

    after(function () {

    });
});
