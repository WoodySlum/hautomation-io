/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var GlobalMocks = require("./../../GlobalMocks");

var APIRequest = require("./../../../src/services/webservices/APIRequest");
var AuthenticationData = require("./../../../src/modules/authentication/AuthenticationData");

describe("APIRequest", function() {

    before(() => {

    });

    it("constructor fill correctly elements without data", function() {
        let r = new APIRequest.class("1", "2", "3", "4", "5", "6");
        expect(r).to.have.property("method").and.equal("1");
        expect(r).to.have.property("ip").and.equal("2");
        expect(r).to.have.property("route").and.equal(":/3/");
        expect(r).to.have.property("path").and.equal("4");
        expect(r).to.have.property("action").and.equal("5");
        expect(r).to.have.property("params").and.equal("6");
        expect(r).to.have.property("data").and.to.be.null;
        expect(r).to.have.property("authenticationData").and.to.be.null;
    });

    it("constructor fill correctly elements with data", function() {
        let r = new APIRequest.class("1", "2", "3", "4", "5", "6", "8", "9", "7");
        expect(r).to.have.property("data").and.equal("7");
    });

    it("should add credentials", function() {
        let a = new AuthenticationData.class(true, "foo", 2);
        let r = new APIRequest.class("1", "2", "3", "4", "5", "6", "7");
        r.addAuthenticationData(a);
        expect(r).to.have.property("authenticationData").and.equal(a);
    });

    after(function () {

    });
});
