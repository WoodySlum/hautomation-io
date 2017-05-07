/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

var AuthenticationData = require("./../../../modules/authentication/AuthenticationData");

describe("AuthenticationData", function() {

    before(() => {

    });

    it("default constructor should fill correctly elements", function() {
        let r = new AuthenticationData.class();
        expect(r).to.have.property("authorized").and.to.be.false;
        expect(r).to.have.property("username").and.to.be.null;
        expect(r).to.have.property("level").and.equal(-1);
    });

    it("constructor should fill correctly elements", function() {
        let r = new AuthenticationData.class(true, "foo", 10);
        expect(r.authorized).to.be.true;
        expect(r.username).to.be.equal("foo");
        expect(r.level).equal(10);
    });

    after(function () {

    });
});
