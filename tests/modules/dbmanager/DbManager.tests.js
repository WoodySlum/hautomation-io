/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var sqlite3 = require("sqlite3");

var DbManager = require("./../../../src/modules/dbmanager/DbManager");
var DbRequestBuilder = require("./../../../src/modules/dbmanager/DbRequestBuilder");

describe("DbManager", function() {
    let dbManager;
    let sqlite3ob = new sqlite3.Database(":memory:");
    const table = "foobar";
    const schema = {"foobar":[
            {"foo" : {"type" : "string", "version" : "0.0.0"}},
            {"bar" : {"type" : "int", "version" : "0.0.0"}}
        ]
    };
    const schemaUp = {"foobar":[
            {"foo" : {"type" : "string", "version" : "0.0.0"}},
            {"bar" : {"type" : "int", "version" : "0.0.0"}},
            {"foobar" : {"type" : "int", "version" : "0.0.1"}},
            {"barfoo" : {"type" : "timestamp", "version" : "0.0.1"}},
        ]
    };

    before(() => {
        dbManager = new DbManager.class({db:""}, sqlite3ob);

    });

    it("constructor should have db property", function() {
        expect(dbManager).to.have.property("db").and.equal(sqlite3ob);
    });

    it("shoud well transform number version to interger", function() {
        expect(dbManager.numberVersion("3.0.14")).to.be.equal(3000014);
    });

    it("should test functionally create table", function(done) {
        dbManager.initSchema(schema, "0.0.0", (err) => {;
            setTimeout(() => {
                sqlite3ob.all("PRAGMA table_info(`"+ table + "`);", (err, res) => {
                    expect(err).to.be.null;
                    expect(res.length).to.be.equal(4);
                    expect(res[0]["type"]).to.be.equal("INTEGER");
                    expect(res[0]["name"]).to.be.equal(dbManager.Operators().FIELD_ID);
                    expect(res[1]["type"]).to.be.equal("TIMESTAMP");
                    expect(res[1]["name"]).to.be.equal(dbManager.Operators().FIELD_TIMESTAMP);
                    expect(res[2]["type"]).to.be.equal("TEXT");
                    expect(res[2]["name"]).to.be.equal("foo");
                    expect(res[3]["type"]).to.be.equal("BIGINT");
                    expect(res[3]["name"]).to.be.equal("bar");
                    done();
                });
            }, 50);
        });
    });

    it("should test functionally update table", function(done) {
        dbManager.initSchema(schemaUp, "0.0.0", (err) => {
            setTimeout(() => {
                sqlite3ob.all("PRAGMA table_info(`" + table + "`);", (err, res) => {
                    expect(err).to.be.null;
                    expect(res.length).to.be.equal(6);
                    expect(res[0]["type"]).to.be.equal("INTEGER");
                    expect(res[0]["name"]).to.be.equal(dbManager.Operators().FIELD_ID);
                    expect(res[1]["type"]).to.be.equal("TIMESTAMP");
                    expect(res[1]["name"]).to.be.equal(dbManager.Operators().FIELD_TIMESTAMP);
                    expect(res[2]["type"]).to.be.equal("TEXT");
                    expect(res[2]["name"]).to.be.equal("foo");
                    expect(res[3]["type"]).to.be.equal("BIGINT");
                    expect(res[3]["name"]).to.be.equal("bar");
                    expect(res[4]["type"]).to.be.equal("BIGINT");
                    expect(res[4]["name"]).to.be.equal("foobar");
                    expect(res[5]["type"]).to.be.equal("TIMESTAMP");
                    expect(res[5]["name"]).to.be.equal("barfoo");
                    done();
                });
            }, 50);
        });
    });

    it("should generate an error while creating table", function() {
        dbManager.initSchema({foobars:[{"foo":{}}]}, "0.0.0", (err) => {
            expect(err).to.be.not.null;
            expect(err.message).to.equal(DbManager.ERROR_UNKNOWN_FIELD_TYPE);
        });
    });

    it("should generate valid request builder object", function() {
        expect(dbManager.RequestBuilder("foo", {}) instanceof DbRequestBuilder.class).to.be.true;
    });

    it("save object should generate an error", function(done) {
        dbManager.saveObject(table, {}, {}, (err, obj) => {
            expect(err).to.be.not.null;
            expect(err.message).to.equal(DbManager.ERROR_UNKNOWN_TABLE);
            done();
        });
    });

    it("save object should do correct stuff", function(done) {
        sinon.spy(sqlite3ob, "run");
        dbManager.saveObject(table, schema, {foo:"bar"}, (err, obj) => {
            expect(sqlite3ob.run.withArgs("INSERT INTO `" + table + "` (foo) VALUES ('bar');", sinon.match.any).calledOnce).to.be.true;
            expect(err).to.be.null;
            sqlite3ob.run.restore();
            done();
        });
    });

    it("get object should generate an error", function(done) {
        dbManager.getObject(table, {}, {}, (err, obj) => {
            expect(err).to.be.not.null;
            expect(err.message).to.equal(DbManager.ERROR_UNKNOWN_TABLE);
            done();
        });
    });

    it("get object should do correct stuff", function(done) {
        sinon.spy(sqlite3ob, "get");
        dbManager.getObject(table, schema, {foo:"bar"}, (err, obj) => {
            expect(sqlite3ob.get.withArgs("SELECT * FROM `" + table + "` WHERE 1=1 AND foo = 'bar' LIMIT 0,1;", sinon.match.any).calledOnce).to.be.true;
            expect(err).to.be.null;
            sqlite3ob.get.restore();
            done();
        });
    });

    it("get objects should generate an error", function(done) {
        dbManager.getObjects(table, {}, {}, (err, obj) => {
            expect(err).to.be.not.null;
            expect(err.message).to.equal(DbManager.ERROR_UNKNOWN_TABLE);
            done();
        });
    });

    it("get objects should do correct stuff", function(done) {
        const request = dbManager.RequestBuilder(table, schema).where("foo", dbManager.Operators().LIKE, "foobar");
        sinon.spy(sqlite3ob, "all");
        sinon.spy(request, "cleanForSelect");

        dbManager.getObjects(table, schema, request, (err, obj) => {
            expect(sqlite3ob.all.withArgs("SELECT * FROM `" + table + "` WHERE 1=1 AND foo LIKE 'foobar';", sinon.match.any).calledOnce).to.be.true;
            expect(request.cleanForSelect.calledOnce).to.be.true;
            expect(err).to.be.null;
            sqlite3ob.all.restore();
            request.cleanForSelect.restore();
            done();
        });
    });

    it("get last object should generate an error", function(done) {
        dbManager.getLastObject(table, {}, (err, obj) => {
            expect(err).to.be.not.null;
            expect(err.message).to.equal(DbManager.ERROR_UNKNOWN_TABLE);
            done();
        });
    });

    it("get last object should do correct stuff", function(done) {
        sinon.spy(sqlite3ob, "get");
        dbManager.getLastObject(table, schema, (err, obj) => {
            expect(sqlite3ob.get.withArgs("SELECT * FROM `" + table + "` ORDER BY timestamp DESC LIMIT 0,1;", sinon.match.any).calledOnce).to.be.true;
            expect(err).to.be.null;
            sqlite3ob.get.restore();
            done();
        });
    });

    it("delete object should generate an error", function(done) {
        dbManager.delObject(table, {}, {}, (err, obj) => {
            expect(err).to.be.not.null;
            expect(err.message).to.equal(DbManager.ERROR_UNKNOWN_TABLE);
            done();
        });
    });

    it("delete object should do correct stuff", function(done) {
        sinon.spy(sqlite3ob, "run");
        dbManager.delObject(table, schema, {bar:123}, (err, obj) => {
            expect(sqlite3ob.run.withArgs("DELETE FROM `" + table + "` WHERE 1=1 AND bar = 123;", sinon.match.any).calledOnce).to.be.true;
            expect(err).to.be.null;
            sqlite3ob.run.restore();
            done();
        });
    });

    it("delete objects should generate an error", function(done) {
        dbManager.delObjects(table, {}, {}, (err, obj) => {
            expect(err).to.be.not.null;
            expect(err.message).to.equal(DbManager.ERROR_UNKNOWN_TABLE);
            done();
        });
    });

    it("delete objects should do correct stuff", function(done) {
        const request = dbManager.RequestBuilder(table, schema).where("bar", dbManager.Operators().GTE, 1981);
        sinon.spy(sqlite3ob, "run");
        sinon.spy(request, "cleanForDelete");

        dbManager.delObjects(table, schema, request, (err, obj) => {
            expect(sqlite3ob.run.withArgs("DELETE FROM `" + table + "` WHERE 1=1 AND bar >= 1981;", sinon.match.any).calledOnce).to.be.true;
            expect(request.cleanForDelete.calledOnce).to.be.true;
            expect(err).to.be.null;
            sqlite3ob.run.restore();
            request.cleanForDelete.restore();
            done();
        });
    });

    it("constructor should close database", function() {
        sinon.spy(sqlite3ob, "close");
        dbManager.close();
        expect(sqlite3ob.close.calledOnce).to.be.true;
    });

    after(function () {

    });
});
