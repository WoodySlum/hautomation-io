/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var GlobalMocks = require("./../../GlobalMocks");

var APIRegistration = require("./../../../src/services/webservices/APIRegistration");
var WebServices = require("./../../../src/services/webservices/WebServices");

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
        expect(r).to.have.property("routeBase");
        expect(r).to.have.property("parameters");
        expect(r.route[0]).to.be.equal("*");
        expect(r.parameters.length).to.be.equal(0);
        expect(r).to.have.property("nbParametersOptional").and.equal(0);
    });

    it("constructor fill correctly all elements", function() {
        let r = new APIRegistration.class(obj, WebServices.GET, ":/foo/bar/");
        expect(r).to.have.property("delegate").and.equal(obj);
        expect(r).to.have.property("method").and.equal(WebServices.GET);
        expect(r).to.have.property("route");
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
        let obj1 = new APIRegistration.class(delegate, WebServices.GET, ":/foo/bar/");
        let obj2 = new APIRegistration.class(delegate, WebServices.GET, ":/bar/foo/");
        expect(obj1.isEqual(obj2)).to.be.false;
    });

    it("should register correcty parameters", function() {
        let delegate = new APIResgistrationClassA();
        let obj = new APIRegistration.class(delegate, WebServices.GET, ":/foo/bar/[paramA]/[paramB]/[paramOptA*]/[paramOptB*]/");
        expect(obj.route).to.be.equal(":/foo/bar/");
        expect(obj.routeBase.length).to.be.equal(6);
        expect(obj.parameters.length).to.be.equal(4);
        expect(obj.parameters[0].name).to.be.equal("paramA");
        expect(obj.parameters[0].optional).to.be.false;
        expect(obj.parameters[1].name).to.be.equal("paramB");
        expect(obj.parameters[1].optional).to.be.false;
        expect(obj.parameters[2].name).to.be.equal("paramOptA");
        expect(obj.parameters[2].optional).to.be.true;
        expect(obj.parameters[3].name).to.be.equal("paramOptB");
        expect(obj.parameters[3].optional).to.be.true;
        expect(obj.nbParametersOptional).to.be.equal(2);
    });

    it("should register parameters in bad order raise error", function() {
        let delegate = new APIResgistrationClassA();
        try {
            let obj = new APIRegistration.class(delegate, WebServices.GET, ":/foo/bar/[paramA]/[paramOptA*]/[paramB]/[paramOptB*]/");
            expect(false).to.be.true;
        } catch (e) {
            expect(e.message).to.be.equal(APIRegistration.ERROR_INVALID_OPTIONAL_PARAMETER);
        }
    });

    after(function () {

    });
});
