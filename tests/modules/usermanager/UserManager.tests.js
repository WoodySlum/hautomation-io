/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

var ConfManager = require("./../../../src/modules/confmanager/ConfManager");
var UserManager = require("./../../../src/modules/usermanager/UserManager");
var Authentication = require("./../../../src/modules/authentication/Authentication");
var HautomationCore = require("./../../../src/HautomationCore");
var UserForm = require("./../../../src/modules/usermanager/UserForm");

const core = new HautomationCore.class();

describe("UserManager", function() {
    const userA = new UserForm.class(1, "userA");
    const userB = new UserForm.class(2, "userB");

    before(() => {

    });

    it("default constructor should fill correctly elements", function() {
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices);
        expect(userManager).to.have.property("formConfiguration");
        expect(userManager).to.have.property("confManager");
    });

    it("getUsers should return a copy of users", function() {
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices);
        userManager.formConfiguration.data = [userA, userB];
        expect(userManager.getUsers()).to.be.not.equal(userManager.users);
    });

    it("getUser should return the user", function() {
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices);
        userManager.formConfiguration.data = [userA, userB];
        expect(userManager.getUser("userA")).to.be.equal(userA);
    });

    it("getUser should return null when not found", function() {
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices);
        userManager.formConfiguration.data = [userA, userB];
        expect(userManager.getUser("userC")).to.be.null;
    });

    it("getAdminUser should return admin user", function() {
        const adminUser = new UserForm.class(0, "admin", "password");
        core.confManager.appConfiguration = {admin :{username:adminUser.username, password:adminUser.password, enable:true}};
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices);
        const admin = userManager.getAdminUser();
        expect(admin.username).to.be.equal(adminUser.username);
        expect(admin.password).to.be.equal(adminUser.password);
        expect(admin.level).to.be.equal(Authentication.AUTH_MAX_LEVEL);
    });

    it("getAdminUser disabled should return null user ", function() {
        const adminUser = new UserForm.class(0, "admin", "password");
        core.confManager.appConfiguration = {admin :{username:adminUser.username, password:adminUser.password, enable:false}};
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices);
        const admin = userManager.getAdminUser();
        expect(admin).to.be.null;
    });

    after(function () {

    });
});
