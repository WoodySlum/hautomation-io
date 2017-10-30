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
        sinon.spy(core.scenarioManager, "register");
        sinon.spy(core.webServices, "registerAPI");
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices, core.dashboardManager, null, core.scenarioManager);
        expect(userManager).to.have.property("formConfiguration");
        expect(userManager).to.have.property("confManager");
        expect(core.scenarioManager.register.calledOnce).to.be.true;
        expect(core.webServices.registerAPI.callCount).to.be.equal(6);
        core.scenarioManager.register.restore();
        core.webServices.registerAPI.restore();
    });

    it("getUsers should return a copy of users", function() {
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices, core.dashboardManager, null, core.scenarioManager);
        userManager.formConfiguration.data = [userA, userB];
        expect(userManager.getUsers()).to.be.not.equal(userManager.users);
    });

    it("getUser should return the user", function() {
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices, core.dashboardManager, null, core.scenarioManager);
        userManager.formConfiguration.data = [userA, userB];
        expect(userManager.getUser("userA").id).to.be.equal(userA.id);
        expect(userManager.getUser("userA").username).to.be.equal(userA.username);
    });

    it("getUser should return null when not found", function() {
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices, core.dashboardManager, null, core.scenarioManager);
        userManager.formConfiguration.data = [userA, userB];
        expect(userManager.getUser("userC")).to.be.null;
    });

    it("getAdminUser should return admin user", function() {
        const adminUser = new UserForm.class(0, "admin", "password");
        core.confManager.appConfiguration = {admin :{username:adminUser.username, password:adminUser.password, enable:true}};
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices, core.dashboardManager, null, core.scenarioManager);
        const admin = userManager.getAdminUser();
        expect(admin.username).to.be.equal(adminUser.username);
        expect(admin.password).to.be.equal(adminUser.password);
        expect(admin.level).to.be.equal(Authentication.AUTH_MAX_LEVEL);
    });

    it("getAdminUser disabled should return null user", function() {
        const adminUser = new UserForm.class(0, "admin", "password");
        core.confManager.appConfiguration = {admin :{username:adminUser.username, password:adminUser.password, enable:false}};
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices, core.dashboardManager, null, core.scenarioManager);
        const admin = userManager.getAdminUser();
        expect(admin).to.be.null;
    });

    it("setUserZone should change user zone ", function() {
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices, core.dashboardManager, null, core.scenarioManager);
        userManager.formConfiguration.data = [userA, userB];
        userManager.setUserZone("userA", false);
        expect(userManager.getUser("userA").atHome).to.be.false;
        userManager.setUserZone("userA", true);
        expect(userManager.getUser("userA").atHome).to.be.true;
        userManager.setUserZone("userC", true);
    });

    it("allUsersAtHome should send correct status ", function() {
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices, core.dashboardManager, null, core.scenarioManager);
        userManager.formConfiguration.data = [userA, userB];
        userManager.setUserZone("userA", false);
        userManager.setUserZone("userB", true);
        expect(userManager.allUsersAtHome()).to.be.false;
        userManager.setUserZone("userA", true);
        userManager.setUserZone("userB", true);
        expect(userManager.allUsersAtHome()).to.be.true;
    });

    it("nobodyAtHome should send correct status", function() {
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices, core.dashboardManager, null, core.scenarioManager);
        userManager.formConfiguration.data = [userA, userB];
        userManager.setUserZone("userA", false);
        userManager.setUserZone("userB", true);
        expect(userManager.nobodyAtHome()).to.be.false;
        userManager.setUserZone("userA", false);
        userManager.setUserZone("userB", false);
        expect(userManager.nobodyAtHome()).to.be.true;
    });

    it("somebodyAtHome should send correct status", function() {
        const userManager = new UserManager.class(core.confManager, core.formManager, core.webServices, core.dashboardManager, null, core.scenarioManager);
        userManager.formConfiguration.data = [userA, userB];
        userManager.setUserZone("userA", false);
        userManager.setUserZone("userB", false);
        expect(userManager.somebodyAtHome()).to.be.false;
        userManager.setUserZone("userA", true);
        userManager.setUserZone("userB", false);
        expect(userManager.somebodyAtHome()).to.be.true;
    });

    after(function () {

    });
});
