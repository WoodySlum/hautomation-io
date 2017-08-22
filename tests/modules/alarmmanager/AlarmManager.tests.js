/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

const FormObject = require("./../../../src/modules/formmanager/FormObject");
const HautomationCore = require("./../../../src/HautomationCore").class;
const DateUtils = require("../../../src/utils/DateUtils");
let core;
const AlarmManager = require("./../../../src/modules/alarmmanager/AlarmManager");
let confManager;
let formManager;
let webServices;
let dashboardManager;
let userManager;
let sensorsManager;
let translateManager;
let alarmManager;

describe("AlarmManager", function() {
    beforeEach(() => {
        core = new HautomationCore();
        confManager = core.confManager;
        formManager = core.formManager;
        webServices = core.webServices;
        dashboardManager = core.dashboardManager;
        userManager = core.userManager;
        sensorsManager = core.sensorsManager;
        translateManager = core.translateManager;
    });

    /*it("constructor should call several methods for intialization", function() {
        sinon.spy(core.webServices, "registerAPI");
        sinon.spy(core.userManager, "registerHomeNotifications");
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager);
        expect(core.webServices.registerAPI.callCount).to.be.equal(5);
        expect(core.userManager.registerHomeNotifications.calledOnce).to.be.true;
        core.webServices.registerAPI.restore();
        core.userManager.registerHomeNotifications.restore();
    });

    it("userLocationTrigger disabled should not enable alarm", function() {
        sinon.stub(core.userManager, "nobodyAtHome").returns(true);
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager);
        alarmManager.formConfiguration.data = {enabled:false, userLocationTrigger:false};
        userManager.formConfiguration.data = [{username:"foobar", atHome:true}];
        userManager.setUserZone("foobar", true);
        expect(alarmManager.alarmStatus()).to.be.false;
        core.userManager.nobodyAtHome.restore();
    });

    it("userLocationTrigger enabled should enable alarm", function() {
        sinon.stub(core.userManager, "nobodyAtHome").returns(true);
        sinon.stub(core.userManager, "somebodyAtHome").returns(false);
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager);
        alarmManager.formConfiguration.data = {enabled:false, userLocationTrigger:true};
        userManager.formConfiguration.data = [{username:"foobar", atHome:true}];
        userManager.setUserZone("foobar", false);
        expect(alarmManager.alarmStatus()).to.be.true;
        core.userManager.nobodyAtHome.restore();
        core.userManager.somebodyAtHome.restore();
    });*/

    it("userLocationTrigger enabled should disable alarm", function() {
        sinon.stub(core.userManager, "nobodyAtHome").returns(false);
        sinon.stub(core.userManager, "somebodyAtHome").returns(true);
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager);
        alarmManager.formConfiguration.data = {enabled:true, userLocationTrigger:true};
        userManager.formConfiguration.data = [{username:"foobar", atHome:false}];
        userManager.setUserZone("foobar", true);
        expect(alarmManager.alarmStatus()).to.be.false;
        core.userManager.nobodyAtHome.restore();
        core.userManager.somebodyAtHome.restore();
    });

    afterEach(() => {
        core = null;
        confManager = null;
        formManager = null;
        webServices = null;
        dashboardManager = null;
        userManager = null;
        sensorsManager = null;
        translateManager = null;
    });
});
