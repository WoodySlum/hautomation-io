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
let deviceManager;
let messageManager;

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
        deviceManager = core.deviceManager;
        messageManager = core.messageManager;
    });

    it("constructor should call several methods for intialization", function() {
        sinon.spy(core.webServices, "registerAPI");
        sinon.spy(core.userManager, "registerHomeNotifications");
        sinon.spy(core.sensorsManager, "registerSensorEvent");
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager);
        expect(core.webServices.registerAPI.callCount).to.be.equal(5);
        expect(core.userManager.registerHomeNotifications.calledOnce).to.be.true;
        expect(core.sensorsManager.registerSensorEvent.calledOnce).to.be.true;
        core.webServices.registerAPI.restore();
        core.userManager.registerHomeNotifications.restore();
        core.sensorsManager.registerSensorEvent.restore();
    });

    it("sensorReadyForTriggering should work good", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager);
        alarmManager.sensorsStatus = {"foobar":DateUtils.class.timestamp(), "barbar":(DateUtils.class.timestamp() - 2 * AlarmManager.SENSORS_LOCK_TIME)};
        expect(alarmManager.sensorReadyForTriggering("barfoo")).to.be.true;
        expect(alarmManager.sensorReadyForTriggering("foobar")).to.be.false;
        expect(alarmManager.sensorReadyForTriggering("barbar")).to.be.true;
    });

    it("enableAlarm should really enable alarm and save status", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager);
        alarmManager.formConfiguration.data = {enabled:false};
        sinon.spy(alarmManager.formConfiguration, "save");
        sinon.spy(alarmManager, "registerTile");
        alarmManager.enableAlarm();
        expect(alarmManager.formConfiguration.save.calledOnce).to.be.true;
        expect(alarmManager.registerTile.calledOnce).to.be.true;
        expect(alarmManager.formConfiguration.data.enabled).to.be.true;
        alarmManager.formConfiguration.save.restore();
        alarmManager.registerTile.restore();
    });

    it("enableAlarm should not enable alarm because that was already the case", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager);
        alarmManager.formConfiguration.data = {enabled:true};
        sinon.spy(alarmManager.formConfiguration, "save");
        sinon.spy(alarmManager, "registerTile");
        alarmManager.enableAlarm();
        expect(alarmManager.formConfiguration.save.calledOnce).to.be.false;
        expect(alarmManager.registerTile.calledOnce).to.be.false;
        expect(alarmManager.formConfiguration.data.enabled).to.be.true;
        alarmManager.formConfiguration.save.restore();
        alarmManager.registerTile.restore();
    });

    it("disableAlarm should really disable alarm and save status", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager);
        alarmManager.formConfiguration.data = {enabled:true};
        sinon.spy(alarmManager.formConfiguration, "save");
        sinon.spy(alarmManager, "registerTile");
        alarmManager.disableAlarm();
        expect(alarmManager.formConfiguration.save.calledOnce).to.be.true;
        expect(alarmManager.registerTile.calledOnce).to.be.true;
        expect(alarmManager.formConfiguration.data.enabled).to.be.false;
        alarmManager.formConfiguration.save.restore();
        alarmManager.registerTile.restore();
    });

    it("disableAlarm should not disable alarm because that was already the case", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager);
        alarmManager.formConfiguration.data = {enabled:false};
        sinon.spy(alarmManager.formConfiguration, "save");
        sinon.spy(alarmManager, "registerTile");
        alarmManager.disableAlarm();
        expect(alarmManager.formConfiguration.save.calledOnce).to.be.false;
        expect(alarmManager.registerTile.calledOnce).to.be.false;
        expect(alarmManager.formConfiguration.data.enabled).to.be.false;
        alarmManager.formConfiguration.save.restore();
        alarmManager.registerTile.restore();
    });

    it("triggerAlarm should trigger alarm", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager);
        alarmManager.formConfiguration.data = {id:1503493095302,enabled:false,userLocationTrigger:true,sensors:[{sensor:{identifier:1501240500},triggerAlarm:true}],devicesOnEnable:[{identifier:1981,status:"on"}],devicesOnDisable:[{identifier:1982,status:"off"}]};
        const spy = sinon.spy(core.deviceManager, "switchDevice");
        sinon.spy(core.messageManager, "sendMessage");
        alarmManager.triggerAlarm();
        expect(core.deviceManager.switchDevice.calledOnce).to.be.true;
        expect(spy.args[0][0]).to.be.equal(1981);
        expect(spy.args[0][1]).to.be.equal("on");
        expect(core.messageManager.sendMessage.calledOnce).to.be.true;
        expect(alarmManager.alarmTriggered).to.be.true;
        core.deviceManager.switchDevice.restore();
        core.messageManager.sendMessage.restore();
    });

    it("triggerAlarm should not trigger alarm beceause that was already triggered previously", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager);
        alarmManager.formConfiguration.data = {id:1503493095302,enabled:false,userLocationTrigger:true,sensors:[{sensor:{identifier:1501240500},triggerAlarm:true}],devicesOnEnable:[{identifier:1981,status:"on"}],devicesOnDisable:[{identifier:1982,status:"off"}]};
        alarmManager.alarmTriggered = true;

        sinon.spy(core.deviceManager, "switchDevice");
        sinon.spy(core.messageManager, "sendMessage");
        alarmManager.triggerAlarm();
        expect(core.deviceManager.switchDevice.calledOnce).to.be.false;
        expect(core.messageManager.sendMessage.calledOnce).to.be.false;
        expect(alarmManager.alarmTriggered).to.be.true;
        core.deviceManager.switchDevice.restore();
        core.messageManager.sendMessage.restore();
    });

    it("stopAlarm should stop running alarm", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager);
        alarmManager.formConfiguration.data = {id:1503493095302,enabled:false,userLocationTrigger:true,sensors:[{sensor:{identifier:1501240500},triggerAlarm:true}],devicesOnEnable:[{identifier:1981,status:"on"}],devicesOnDisable:[{identifier:1982,status:"off"}]};
        alarmManager.alarmTriggered = true;

        const spy = sinon.spy(core.deviceManager, "switchDevice");
        alarmManager.stopAlarm();
        expect(core.deviceManager.switchDevice.calledOnce).to.be.true;
        expect(spy.args[0][0]).to.be.equal(1982);
        expect(spy.args[0][1]).to.be.equal("off");
        expect(alarmManager.alarmTriggered).to.be.false;
        core.deviceManager.switchDevice.restore();
    });

    it("stopAlarm should not stop running alarm beceause that was already triggered previously", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager);
        alarmManager.formConfiguration.data = {id:1503493095302,enabled:false,userLocationTrigger:true,sensors:[{sensor:{identifier:1501240500},triggerAlarm:true}],devicesOnEnable:[{identifier:1981,status:"on"}],devicesOnDisable:[{identifier:1982,status:"off"}]};
        alarmManager.alarmTriggered = false;

        const spy = sinon.spy(core.deviceManager, "switchDevice");
        alarmManager.stopAlarm();
        expect(core.deviceManager.switchDevice.calledOnce).to.be.false;
        expect(alarmManager.alarmTriggered).to.be.false;
        core.deviceManager.switchDevice.restore();
    });

    // More functional tests

    it("userLocationTrigger disabled should not enable alarm", function() {
        sinon.stub(core.userManager, "nobodyAtHome").returns(true);
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager);
        alarmManager.formConfiguration.data = {enabled:false, userLocationTrigger:false};
        userManager.formConfiguration.data = [{username:"foobar", atHome:true}];
        userManager.setUserZone("foobar", true);
        expect(alarmManager.alarmStatus()).to.be.false;
        core.userManager.nobodyAtHome.restore();
    });

    it("userLocationTrigger enabled should enable alarm", function() {
        sinon.stub(core.userManager, "nobodyAtHome").returns(true);
        sinon.stub(core.userManager, "somebodyAtHome").returns(false);
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager);
        alarmManager.formConfiguration.data = {enabled:false, userLocationTrigger:true};
        userManager.formConfiguration.data = [{username:"foobar", atHome:true}];
        userManager.setUserZone("foobar", false);
        expect(alarmManager.alarmStatus()).to.be.true;
        core.userManager.nobodyAtHome.restore();
        core.userManager.somebodyAtHome.restore();
    });

    it("userLocationTrigger enabled should disable alarm", function() {
        sinon.stub(core.userManager, "nobodyAtHome").returns(false);
        sinon.stub(core.userManager, "somebodyAtHome").returns(true);
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager);
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
        deviceManager = null;
        messageManager = null;
    });
});
