/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

var ConfManager = require("./../../../modules/confmanager/ConfManager");

describe("ConfManager", function() {
    const confManager = new ConfManager.class({configurationPath:"/foo/bar"});

    // Not possible to make sinon stub working correctly with readFileSync :(
    const fsMock = {
        readFileSync: function(path, mode){return "{\"foo\":\"bar\"}";},
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
         let readFileSpy = sinon.spy(confManager.fs, 'readFileSync');
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
         let writeFileSpy = sinon.spy(confManager.fs, 'writeFile');
         try {
             confManager.saveData({foo:"bar"}, "foo");
        } catch(e) {
            expect(false).to.be.true; // This should not happened because an exception is thrown
        }

         expect(confManager.fs.writeFile.withArgs("/foo/bar/foo.json", "{\"foo\":\"bar\"}", sinon.match.any).calledOnce).to.be.true;
    });

    it("saveData should throw error", function() {
         confManager.fs = fsMockException;
         let writeFileSpy = sinon.spy(confManager.fs, 'writeFile');
         try {
             confManager.saveData({foo:"bar"}, "foo");
             expect(false).to.be.true; // This should not happened because an exception is thrown
        } catch(e) {
            expect(e.message).to.be.equal("foobar");
        }
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

    after(function () {

    });
});
