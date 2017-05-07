/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

var APIRegistration = require("./../../../services/webservices/APIRegistration");
var WebServices = require("./../../../services/webservices/WebServices");

class APIResgistrationClassA {}
class APIResgistrationClassB extends APIResgistrationClassA {}


describe("APIRegistration", function() {
    const obj = {foo:"bar"};

    before(() => {

    });

    it("constructor fill correctly elements without only delegate", function() {
        let r = new APIRegistration.class(obj);
        expect(r).to.have.property("delegate").and.equal(obj);
        expect(r).to.have.property("method").and.equal("*");
        expect(r).to.have.property("route").and.equal("*");
    });

    it("constructor fill correctly all elements", function() {
        let r = new APIRegistration.class(obj, WebServices.GET, ":/foo/bar/");
        expect(r).to.have.property("delegate").and.equal(obj);
        expect(r).to.have.property("method").and.equal(WebServices.GET);
        expect(r).to.have.property("route").and.equal(":/foo/bar/");
    });

    it("should be equal", function() {
        let delegate = new APIResgistrationClassA();
        let obj1 = new APIRegistration.class(delegate);
        let obj2 = new APIRegistration.class(delegate);
        expect(obj1.isEqual(obj2)).to.be.true;
    });

    it("should not be equal due to objects", function() {
        let delegateA = new APIResgistrationClassA();
        let delegateB = new APIResgistrationClassB();
        let obj1 = new APIRegistration.class(delegateA);
        let obj2 = new APIRegistration.class(delegateB);
        expect(obj1.isEqual(obj2)).to.be.false;
    });

    it("should not be equal due to params", function() {
        let delegate = new APIResgistrationClassA();
        let obj1 = new APIRegistration.class(delegate, ":/foo/bar/");
        let obj2 = new APIRegistration.class(delegate, ":/bar/foo/");
        expect(obj1.isEqual(obj2)).to.be.false;
    });

    after(function () {

    });
});
