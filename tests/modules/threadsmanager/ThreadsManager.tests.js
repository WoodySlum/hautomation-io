/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var GlobalMocks = require("./../../GlobalMocks");

var ThreadsManager = require("./../../../src/modules/threadsmanager/ThreadsManager");

class Foo {
    constructor() {

    }

    bar(data, send) {
        var a = {};
    }
}

function bar(data, send) {
    var a = {};
}

const expectedStringifyClass = `(data, send) => {
        var a = {};
     return this;}`;
const expectedStringifyFunc = `(data, send) => {
    var a = {};
 return this;}`;

describe("ThreadsManager", function() {
    const threadsManager = new ThreadsManager.class();

    before(() => {

    });

    it("default constructor should have empty thread object", () => {
        expect(threadsManager).to.have.property("threads");
        expect(Object.keys(threadsManager.threads).length).to.be.equal(0);
    });

    if (!process.env.COV) { // Can't be covered due to mangling of symbols
        it("stringify should transform class method to classic function", () => {
            let c = new Foo();
            expect(threadsManager.stringifyFunc(c.bar)).to.be.equals(expectedStringifyClass);
        });

        it("stringify should transform a standard method to classic function", () => {
            expect(threadsManager.stringifyFunc(bar)).to.be.equals(expectedStringifyFunc);
        });
    }

    it("send with unknown identifier should raise error", () => {
        try {
            threadsManager.send("foo");
            expect(false).to.be.true;
        } catch(e) {
            expect(e.message).to.be.equals(ThreadsManager.ERROR_UNKNOWN_IDENTIFIER + " foo");
        }
    });

    it("kill with unknown identifier should raise error", () => {
        try {
            threadsManager.kill("foo");
            expect(false).to.be.true;
        } catch(e) {
            expect(e.message).to.be.equals(ThreadsManager.ERROR_UNKNOWN_IDENTIFIER);
        }
    });

    it("get pid should return null", () => {
        expect(threadsManager.getPid("foo")).to.be.null;
    });

    it("is running should return false", () => {
        expect(threadsManager.isRunning("foo")).to.be.false;
    });

    it("should run 'run' as well", () => {
        sinon.spy(threadsManager, "stringifyFunc");
        threadsManager.run(bar, "foo");

        expect(threadsManager.stringifyFunc.calledOnce).to.be.true;
        expect(Object.keys(threadsManager.threads).length).to.be.equal(1);

        threadsManager.stringifyFunc.restore();
    });

    after(() => {

    });
});
