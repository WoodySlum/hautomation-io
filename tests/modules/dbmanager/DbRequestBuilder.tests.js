/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

var DbRequestBuilder = require("./../../../src/modules/dbmanager/DbRequestBuilder");

describe("DbRequestBuilder", function() {
    const table = "foobar";
    const schema = {"foobar":[
            {"foo" : {"type" : "string", "version" : "0.0.0"}},
            {"bar" : {"type" : "int", "version" : "0.0.0"}}
        ]
    };

    const obj1 = {foo:"foo'bar", bar:200};
    const obj2 = {id:2, foo:"foo'bar", bar:200};
    const obj3 = {bar:100};

    before(() => {

    });

    it("should save a new object", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .save(obj1)
                    .request();
        expect(sql).to.be.equal("INSERT INTO `foobar` (foo,bar) VALUES ('foo''bar',200);");
    });

    it("should update existing object", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .save(obj2)
                    .request();
        expect(sql).to.be.equal("UPDATE `foobar` SET id=2,foo='foo''bar',bar=200 WHERE 1=1 AND id=2;");
    });

    it("should get existing object", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .get(obj2)
                    .request();
        expect(sql).to.be.equal("SELECT * FROM `foobar` WHERE 1=1 AND id = 2 AND foo = 'foo''bar' AND bar = 200;");
    });

    it("should delete existing object", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .del(obj2)
                    .request();
        expect(sql).to.be.equal("DELETE FROM `foobar` WHERE 1=1 AND id = 2 AND foo = 'foo''bar' AND bar = 200;");
    });

    it("select operator fields query should be correct", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .selectOp(DbRequestBuilder.COUNT, DbRequestBuilder.FIELD_ID, "nb")
                    .where("foo", DbRequestBuilder.EQ, "test")
                    .request();
        expect(sql).to.be.equal("SELECT COUNT(id) AS nb FROM `foobar` WHERE 1=1 AND foo = 'test';");
    });

    it("select fields query should be correct", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .select("foo", "bar")
                    .where("foo", DbRequestBuilder.EQ, "test")
                    .request();
        expect(sql).to.be.equal("SELECT foo,bar FROM `foobar` WHERE 1=1 AND foo = 'test';");
    });

    it("select all fields query should be good also", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .select()
                    .where("foo", DbRequestBuilder.EQ, "test")
                    .request();
        expect(sql).to.be.equal("SELECT * FROM `foobar` WHERE 1=1 AND foo = 'test';");
    });

    it("insert some fields should be well played", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .insert("bar")
                    .values(312)
                    .request();
        expect(sql).to.be.equal("INSERT INTO `foobar` (bar) VALUES (312);");
    });

    it("insert all fields should be well played", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .insert()
                    .values("foo'bar", 312)
                    .request();
        expect(sql).to.be.equal("INSERT INTO `foobar` (foo,bar) VALUES ('foo''bar',312);");
    });

    it("update some fields should be well played", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .update("bar")
                    .values(312)
                    .where(DbRequestBuilder.FIELD_ID, DbRequestBuilder.EQ, 2)
                    .request();
        expect(sql).to.be.equal("UPDATE `foobar` SET bar=312 WHERE 1=1 AND id = 2;");
    });

    it("update some fields should be well played", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .update()
                    .values("foo'bar", 312)
                    .where(DbRequestBuilder.FIELD_ID, DbRequestBuilder.EQ, 2)
                    .request();
        expect(sql).to.be.equal("UPDATE `foobar` SET foo='foo''bar',bar=312 WHERE 1=1 AND id = 2;");
    });

    it("order calls doesn't matter", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .where(DbRequestBuilder.FIELD_ID, DbRequestBuilder.EQ, 2)
                    .values("foo'bar", 312)
                    .update()
                    .request();
        expect(sql).to.be.equal("UPDATE `foobar` SET foo='foo''bar',bar=312 WHERE 1=1 AND id = 2;");
    });

    it("remove should be well played", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .remove()
                    .where(DbRequestBuilder.FIELD_ID, DbRequestBuilder.EQ, 15)
                    .request();
        expect(sql).to.be.equal("DELETE FROM `foobar` WHERE 1=1 AND id = 15;");
    });

    it("should process a complex where ", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .select()
                    .where(DbRequestBuilder.FIELD_ID, DbRequestBuilder.EQ, 15)
                    .complexWhere("((" + DbRequestBuilder.FIELD_TIMESTAMP + " BETWEEN 0 AND 999) OR " + DbRequestBuilder.FIELD_ID + DbRequestBuilder.GT + "2))")
                    .request();
        expect(sql).to.be.equal("SELECT * FROM `foobar` WHERE 1=1 AND id = 15 AND ((timestamp BETWEEN 0 AND 999) OR id>2));");
    });


    it("select fields group by operator query should be successfully generated", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .select("foo", "bar")
                    .where("foo", DbRequestBuilder.EQ, "test")
                    .groupOp(DbRequestBuilder.MAX, "bar")
                    .request();
        expect(sql).to.be.equal("SELECT foo,bar FROM `foobar` WHERE 1=1 AND foo = 'test' GROUP BY MAX(bar);");
    });

    it("select fields group by query should be successfully generated", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .select("foo", "bar")
                    .where("foo", DbRequestBuilder.EQ, "test")
                    .group("bar")
                    .request();
        expect(sql).to.be.equal("SELECT foo,bar FROM `foobar` WHERE 1=1 AND foo = 'test' GROUP BY bar;");
    });

    it("should get existing object ordered by bar desc", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .get(obj3)
                    .order(DbRequestBuilder.DESC, DbRequestBuilder.FIELD_ID)
                    .request();
        expect(sql).to.be.equal("SELECT * FROM `foobar` WHERE 1=1 AND bar = 100 ORDER BY id DESC;");
    });

    it("should limit the results", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .get(obj3)
                    .order(DbRequestBuilder.DESC, DbRequestBuilder.FIELD_ID)
                    .lim(5,10)
                    .request();
        expect(sql).to.be.equal("SELECT * FROM `foobar` WHERE 1=1 AND bar = 100 ORDER BY id DESC LIMIT 5,10;");
    });

    it("should take 5 first items", function() {
        let sql = new DbRequestBuilder.class(table, schema)
                    .get(obj3)
                    .order(DbRequestBuilder.DESC, DbRequestBuilder.FIELD_ID)
                    .first(5)
                    .request();
        expect(sql).to.be.equal("SELECT * FROM `foobar` WHERE 1=1 AND bar = 100 ORDER BY id DESC LIMIT 0,5;");
    });

    it("clean select should be correctly processed", function() {
        let request = new DbRequestBuilder.class(table, schema)
                    .update("foo")
                    .values("bar");
        sinon.spy(request, "select");
        request.cleanForSelect();
        expect(request.select.calledOnce).to.be.true;
        expect(request.insertList.length).to.be.equal(0);
        expect(request.updateList.length).to.be.equal(0);

        request.select.restore();
    });

    it("clean delete should be correctly processed", function() {
        let request = new DbRequestBuilder.class(table, schema)
                    .select()
                    .order(DbRequestBuilder.DESC, DbRequestBuilder.FIELD_ID)
                    .lim(5,10);
        sinon.spy(request, "remove");
        request.cleanForDelete();
        expect(request.remove.calledOnce).to.be.true;
        expect(request.insertList.length).to.be.equal(0);
        expect(request.selectList.length).to.be.equal(0);
        expect(request.updateList.length).to.be.equal(0);

        request.remove.restore();
    });

    it("should update with a specific timestamp", function() {
        obj2[DbRequestBuilder.FIELD_TIMESTAMP] = 1511216868;
        let sql = new DbRequestBuilder.class(table, schema)
                    .save(obj2)
                    .request();
        expect(sql).to.be.equal("UPDATE `foobar` SET id=2,foo='foo''bar',bar=200,timestamp=datetime(1511216868, 'unixepoch'), WHERE 1=1 AND id=2;");
    });

    it("should save a new object with timestamp", function() {
        obj1[DbRequestBuilder.FIELD_TIMESTAMP] = 1511216869;
        let sql = new DbRequestBuilder.class(table, schema)
                    .save(obj1)
                    .request();
        expect(sql).to.be.equal("INSERT INTO `foobar` (foo,bar,timestamp) VALUES ('foo''bar',200,datetime(1511216869, 'unixepoch'));");
    });

    after(function () {

    });
});
