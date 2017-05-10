/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

var ConfManager = require("./../../../src/modules/confmanager/ConfManager");

describe("ConfManager", function() {
    const confManager = new ConfManager.class({configurationPath:"/foo/bar"});

    // Not possible to make sinon stub working correctly with readFileSync :(
    const fsMock = {
        readFileSync: function(path, mode){return "{\"foo\":\"bar\"}";},
        writeFile: function(file, data, callback){callback();}
    }
    const fsMockArray = {
        readFileSync: function(path, mode){return "[{\"foo\":\"bar\"},{\"foo\":\"foo\"}]";},
        writeFile: function(file, data, callback){callback();}
    }
    const fsMockInvalid = {
        readFileSync: function(path, mode){return "foobar";},
        writeFile: function(file, data, callback){callback();}
    }
    const fsMockEmpty = {
        readFileSync: function(path, mode){return null;},
        writeFile: function(file, data, callback){callback();}
    }
    const fsMockException = {
        readFileSync: function(path, mode){throw Error("foobar");},
        writeFile: function(file, data, callback){throw Error("foobar");callback();}
    }
    // Fake methods
    function comparator(obj1, obj2) {
        return (obj1.foo === obj2.foo)?true:false;
    }
    // Fake classes
    class Foo {
        constructor(foo) {
            this.foo = foo;
        }
        json(o) {
            return new Foo(o.foo);
        }
    }
    class FooNoJson {
        constructor(foo) {
            this.foo = foo;
        }
    }


    before(() => {
        confManager.fs = fsMock;
    });

    it("default constructor should fill correctly elements", function() {
        let c = new ConfManager.class();
        expect(c).to.have.property("appConfiguration");
        expect(c).to.have.property("fs");
    });

    it("getFilePath should return correct path", function() {
        let c = new ConfManager.class({configurationPath:"/foo/bar"});
        expect(c.getFilePath("t")).to.be.equal("/foo/bar/t.json");
        c = new ConfManager.class({configurationPath:"/foo/bar/"});
        expect(c.getFilePath("tt")).to.be.equal("/foo/bar/tt.json");
    });

    it("isJsonValid should check correctly parameter data", function() {
        expect(confManager.isJsonValid("{\"foo\":\"bar\"}")).to.be.true;
        expect(confManager.isJsonValid("foobar")).to.be.false;
        expect(confManager.isJsonValid(null)).to.be.true;
    });

    // File access
    it("readFile should set back data", function() {
         sinon.spy(confManager.fs, 'readFileSync');
         let result = confManager.readFile("foo");
         expect(confManager.fs.readFileSync.withArgs("foo", "utf-8").calledOnce).to.be.true;
         expect(result.foo).to.be.equal("bar");
         confManager.fs.readFileSync.restore();
    });

    it("readFile should throw error due to invalid JSON", function() {
         confManager.fs = fsMockInvalid;

         try {
             confManager.readFile("foo");
             expect(false).to.be.true; // This should not happened because an exception is thrown
         } catch(e) {
             expect(e.message).to.be.equal(ConfManager.ERROR_INVALID_JSON);
         }
    });

    it("readFile should throw error due to null content", function() {
         confManager.fs = fsMockEmpty;

         try {
             confManager.readFile("foo");
             expect(false).to.be.true; // This should not happened because an exception is thrown
         } catch(e) {
             expect(e.message).to.be.equal(ConfManager.ERROR_EMPTY_FILE);
         }
    });

    it("readFile should throw error due to file system error", function() {
         confManager.fs = fsMockException;

         try {
             confManager.readFile("foo");
             expect(false).to.be.true; // This should not happened because an exception is thrown
         } catch(e) {
             expect(e.message).to.be.equal(ConfManager.ERROR_INVALID_FILE);
         }
    });

    it("saveData should be corrctly done", function() {
         confManager.fs = fsMock;
         sinon.spy(confManager.fs, 'writeFile');
         try {
             confManager.saveData({foo:"bar"}, "foo");
        } catch(e) {
            expect(false).to.be.true; // This should not happened because an exception is thrown
        }

         expect(confManager.fs.writeFile.withArgs("/foo/bar/foo.json", "{\"foo\":\"bar\"}", sinon.match.any).calledOnce).to.be.true;
         confManager.fs.writeFile.restore();
    });

    it("saveData should throw error", function() {
        confManager.fs = fsMockException;
        sinon.spy(confManager.fs, 'writeFile');
        try {
            confManager.saveData({foo:"bar"}, "foo");
            expect(false).to.be.true; // This should not happened because an exception is thrown
        } catch(e) {
            expect(e.message).to.be.equal("foobar");
        }
        confManager.fs.writeFile.restore();
    });

    // Load and save data/s
    it("loadData should be well done", function() {
         confManager.fs = fsMock;
         let r = confManager.loadData(Foo, "notimportant");
         expect(r instanceof Foo).to.be.true;
         expect(r.foo).to.be.equal("bar");
    });

    it("loadData should throw error", function() {
         confManager.fs = fsMock;
         try {
             let r = confManager.loadData(FooNoJson, "notimportant");
             expect(false).to.be.true; // This should not happened because an exception is thrown
         } catch(e) {
             expect(e.message).to.be.equal(ConfManager.ERROR_NO_JSON_METHOD);
         }
    });

    it("loadDatas should be well done", function() {
         confManager.fs = fsMockArray;
         let r = confManager.loadDatas(Foo, "notimportant");
         expect(r.length).to.be.equal(2);
         expect(r[0] instanceof Foo).to.be.true;
         expect(r[0].foo).to.be.equal("bar");
         expect(r[1] instanceof Foo).to.be.true;
         expect(r[1].foo).to.be.equal("foo");
    });

    it("loadDatas should throw error", function() {
         confManager.fs = fsMockArray;
         try {
             let r = confManager.loadDatas(FooNoJson, "notimportant");
             expect(false).to.be.true; // This should not happened because an exception is thrown
         } catch(e) {
             expect(e.message).to.be.equal(ConfManager.ERROR_NO_JSON_METHOD);
         }
    });

    // Get, Set and Del
    it("getData should find data", function() {
         confManager.fs = fsMockArray;
         let datas = confManager.loadDatas(Foo, "notimportant");
         let data = new Foo("foo");
         let r = confManager.getData(datas, data, comparator);

         expect(r instanceof Foo).to.be.true;
         expect(r.foo).to.be.equal("foo");
    });

    it("getData should not find data", function() {
         confManager.fs = fsMockArray;
         let datas = confManager.loadDatas(Foo, "notimportant");
         let data = new Foo("foobar");
         let r = confManager.getData(datas, data, comparator);

         expect(r).to.be.null;
    });

    it("setData should process save correctly", function() {
         confManager.fs = fsMockArray;
         let datas = confManager.loadDatas(Foo, "notimportant");
         let data = new Foo("foobar");
         sinon.spy(confManager, 'saveData');
         sinon.spy(confManager, 'removeData');
         sinon.spy(datas, 'push');

         let r = confManager.setData(datas, "notimportant", data, comparator);

         expect(confManager.removeData.withArgs(datas, "notimportant", data, comparator).calledOnce).to.be.true;
         expect(datas.push.withArgs(data).calledOnce).to.be.true;
         expect(confManager.saveData.withArgs(sinon.match.any, "notimportant").calledOnce).to.be.true;
         expect(r[r.length-1].foo).to.be.equal("foobar");

         confManager.removeData.restore();
         datas.push.restore();
         confManager.saveData.restore();
    });

    it("removeData should be well processed", function() {
        confManager.fs = fsMockArray;
        let datas = confManager.loadDatas(Foo, "notimportant");
        let data = new Foo("foo");
        sinon.spy(confManager, 'saveData');
        sinon.spy(datas, 'splice');
        sinon.spy(datas, 'indexOf');

        let r = confManager.removeData(datas, "notimportant", data, comparator);

        expect(datas.splice.withArgs(sinon.match.any, 1).calledOnce).to.be.true;
        expect(datas.indexOf.withArgs(sinon.match.any).calledOnce).to.be.true;
        expect(confManager.saveData.withArgs(sinon.match.any, "notimportant").calledOnce).to.be.true;
        expect(r.length).to.be.equal(1);

        datas.indexOf.restore();
        datas.splice.restore();
        confManager.saveData.restore();
    });

    it("removeData should throw error", function() {
        confManager.fs = fsMockArray;
        let datas = confManager.loadDatas(Foo, "notimportant");
        let data = new Foo("foobar");

        try {
            let r = confManager.removeData(datas, "notimportant", data, comparator);
            expect(false).to.be.true; // This should not happened because an exception is thrown
        } catch(e) {
            expect(e.message).to.be.equal(ConfManager.DATA_NOT_FOUND);
        }

    });

    after(function () {

    });
});
