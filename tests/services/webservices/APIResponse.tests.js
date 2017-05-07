/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

var APIResponse = require("./../../../services/webservices/APIResponse");

describe("APIResponse", function() {

    before(() => {

    });

    it("constructor fill correctly elements default values", function() {
        let r = new APIResponse.class();
        expect(r).to.have.property("success").and.to.be.false;
        expect(r).to.have.property("response").and.to.exist;
        expect(r).to.have.property("errorCode").and.to.be.equal(-1);
        expect(r).to.have.property("errorMessage").and.to.be.null;
    });

    it("constructor should fill values with parameters", function() {
        let response = {foo:"bar"}
        let r = new APIResponse.class(true, response, 10, "foo");
        expect(r.success).to.be.true;
        expect(r.response).to.be.equal(response);
        expect(r.errorCode).to.be.equal(10);
        expect(r.errorMessage).to.be.equal("foo");
    });


    after(function () {

    });
});
