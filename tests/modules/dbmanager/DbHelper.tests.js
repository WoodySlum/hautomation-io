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
        dbManager.initSchema(schema, "0.0.0");
        dbHelper = new DbHelper.class(dbManager, schema, table);
    });


    it("constructor should have correct properties", function() {
        expect(dbHelper).to.have.property("dbManager").and.to.be.equal(dbManager);
        expect(dbHelper).to.have.property("schema").and.to.be.equal(schema);
        expect(dbHelper).to.have.property("table").and.to.be.equal(table);
        expect(dbHelper).to.have.property("dbObjectClass").and.to.be.equal(DbObject.class);
    });

    it("getFieldsForTable should call DbManager's one", function() {
        sinon.spy(dbManager, "getFieldsForTable");
        dbHelper.getFieldsForTable();
        expect(dbManager.getFieldsForTable.calledOnce).to.be.true;
        dbManager.getFieldsForTable.restore();
    });

    it("saveObject should call DbManager's one", function(done) {
        sinon.spy(dbManager, "saveObject");
        dbHelper.saveObject({foo:"bar", bar:123}, (error) => {
            expect(dbManager.saveObject.calledOnce).to.be.true;
            dbManager.saveObject.restore();
            done();
        });
    });

    it("getObject should call DbManager's one and have a valid DbObject", function(done) {
        sinon.spy(dbManager, "getObject");
        dbHelper.getObject({bar:123}, (error, object) => {
            expect(object).to.be.not.null;
            expect(object instanceof DbObject.class).to.be.true;
            expect(dbManager.getObject.calledOnce).to.be.true;
            dbManager.getObject.restore();
            done();
        });
    });

    it("getObjects should call DbManager's one and have a valid DbObject", function(done) {
        sinon.spy(dbManager, "getObjects");
        dbHelper.getObjects(dbHelper.RequestBuilder().where("foo", dbHelper.Operators().EQ, "bar"), (error, objects) => {
            expect(objects).to.be.not.null;
            expect(objects.length).to.be.equal(1);
            expect(objects[0] instanceof DbObject.class).to.be.true;
            expect(dbManager.getObjects.calledOnce).to.be.true;
            dbManager.getObjects.restore();
            done();
        });
    });

    it("getLastObject should call DbManager's one and have a valid DbObject", function(done) {
        sinon.spy(dbManager, "getLastObject");
        dbHelper.getLastObject((error, object) => {
            expect(object).to.be.not.null;
            expect(object instanceof DbObject.class).to.be.true;
            expect(dbManager.getLastObject.calledOnce).to.be.true;
            dbManager.getLastObject.restore();
            done();
        });
    });

    it("delObject should call DbManager's one", function(done) {
        sinon.spy(dbManager, "delObject");
        dbHelper.delObject({foo:"bar"}, (error) => {
            expect(dbManager.delObject.calledOnce).to.be.true;
            dbManager.delObject.restore();
            done();
        });
    });

    it("delObjects should call DbManager's one", function(done) {
        sinon.spy(dbManager, "delObjects");
        dbHelper.delObjects(dbHelper.RequestBuilder().where("foo", dbHelper.Operators().EQ, "bar"), (error) => {
            expect(dbManager.delObjects.calledOnce).to.be.true;
            dbManager.delObjects.restore();
            done();
        });
    });

    after(function () {
        dbManager.close();
    });
});
