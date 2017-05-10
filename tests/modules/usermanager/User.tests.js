/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

var User = require("./../../../modules/usermanager/User");

describe("User", function() {
    const user = new User.class("username", "password", 0, "fullName", "email", "phone", "picture");

    before(() => {

    });

    it("default constructor should fill correctly elements", function() {
        expect(user).to.have.property("username");
        expect(user).to.have.property("password");
        expect(user).to.have.property("level");
        expect(user).to.have.property("fullName");
        expect(user).to.have.property("email");
        expect(user).to.have.property("phone");
        expect(user).to.have.property("picture");
    });

    it("should impelement json method", function() {
        expect(typeof user.json === "function").to.be.true;
    });

    after(function () {

    });
});
