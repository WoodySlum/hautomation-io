/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

var ConfManager = require("./../../../src/modules/confmanager/ConfManager");
var UserManager = require("./../../../src/modules/usermanager/UserManager");
var User = require("./../../../src/modules/usermanager/User");
var Authentication = require("./../../../src/modules/authentication/Authentication");

describe("UserManager", function() {
    const confManager = new ConfManager.class(null);
    const userA = new User.class("userA");
    const userB = new User.class("userB");

    before(() => {
        sinon.stub(confManager, "loadData").returns([userA, userB]);
    });

    it("default constructor should fill correctly elements", function() {
        const userManager = new UserManager.class(confManager);
        expect(userManager).to.have.property("users");
    });

    it("removeUser should really remove user", function() {
        sinon.stub(confManager, "removeData").returns([userB]);
        const userManager = new UserManager.class(confManager);
        userManager.removeUser("userA");
        expect(confManager.removeData.withArgs(sinon.match.any).calledOnce).to.be.true;
        expect(userManager.users.length).to.be.equal(1);
        confManager.removeData.restore();
    });

    it("removeUser throw error when not found", function() {
        sinon.stub(confManager, "removeData").throws(Error());
        const userManager = new UserManager.class(confManager);
        try {
            userManager.removeUser("userC");
            expect(false).to.be.true; // This should not happened because an exception is thrown
        } catch(e) {
            console.log(e.message);
            expect(e.message).to.be.equal(UserManager.ERROR_USER_NOT_FOUND);
        }
        confManager.removeData.restore();
    });

    it("getUsers should return a copy of users", function() {
        const userManager = new UserManager.class(confManager);
        expect(userManager.getUsers()).to.be.not.equal(userManager.users);
    });

    it("getUser should return the user", function() {
        const userManager = new UserManager.class(confManager);
        expect(userManager.getUser("userA")).to.be.equal(userA);
    });

    it("getUser should return null when not found", function() {
        const userManager = new UserManager.class(confManager);
        expect(userManager.getUser("userC")).to.be.null;
    });

    it("setUser should add user", function() {
        const newUser = new User.class("UserC");
        const userManager = new UserManager.class(confManager);
        sinon.stub(confManager, "setData").returns([userA, userB, newUser]);
        userManager.setUser(newUser);
        expect(confManager.setData.withArgs(sinon.match.any, newUser, sinon.match.any, sinon.match.any).calledOnce).to.be.true;
        confManager.setData.restore();
    });

    it("getAdminUser should return admin user", function() {
        const adminUser = new User.class("admin", "password");
        confManager.appConfiguration = {admin :{username:adminUser.username, password:adminUser.password, enable:true}};
        const userManager = new UserManager.class(confManager);
        const admin = userManager.getAdminUser();
        expect(admin.username).to.be.equal(adminUser.username);
        expect(admin.password).to.be.equal(adminUser.password);
        expect(admin.level).to.be.equal(Authentication.AUTH_MAX_LEVEL);
    });

    it("getAdminUser disabled should return null user ", function() {
        const adminUser = new User.class("admin", "password");
        confManager.appConfiguration = {admin :{username:adminUser.username, password:adminUser.password, enable:false}};
        const userManager = new UserManager.class(confManager);
        const admin = userManager.getAdminUser();
        expect(admin).to.be.null;
    });

    after(function () {
        confManager.loadData.restore();
    });
});
