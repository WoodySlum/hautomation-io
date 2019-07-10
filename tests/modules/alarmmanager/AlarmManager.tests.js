/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var GlobalMocks = require("./../../GlobalMocks");

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
let schedulerService;
let scenarioManager;

describe("AlarmManager", function() {
    beforeEach(() => {
        core = new HautomationCore();
        confManager = core.confManager;
        formManager = core.formManager;
        webServices = core.webServices;
        dashboardManager = core.dashboardManager;
        userManager = core.userManager;
        userManager = core.userManager;
        sensorsManager = core.sensorsManager;
        translateManager = core.translateManager;
        deviceManager = core.deviceManager;
        sensorsManager.sensorsConfiguration = [{id:1501240500,plugin:"esp-temperature-sensor",name:"foobar",dashboard:true,statistics:true,dashboardColor:"#6b3583",unit:"cel"}];
        messageManager = core.messageManager;
        schedulerService = core.schedulerService;
        camerasManager = core.camerasManager;
        botEngine = core.botEngine;
        scenarioManager = core.scenarioManager;
    });

    it("constructor should call several methods for intialization", function() {
        sinon.spy(core.webServices, "registerAPI");
        sinon.spy(core.userManager, "registerHomeNotifications");
        sinon.spy(core.sensorsManager, "registerSensorEvent");
        sinon.spy(core.schedulerService, "register");
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
        expect(core.webServices.registerAPI.callCount).to.be.equal(5);
        expect(core.userManager.registerHomeNotifications.calledOnce).to.be.true;
        expect(core.sensorsManager.registerSensorEvent.calledOnce).to.be.true;
        expect(core.schedulerService.register.calledOnce).to.be.true;
        core.webServices.registerAPI.restore();
        core.userManager.registerHomeNotifications.restore();
        core.sensorsManager.registerSensorEvent.restore();
        core.schedulerService.register.restore();
    });

    it("sensorReadyForTriggering should work good", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
        alarmManager.sensorsStatus = {"foobar":DateUtils.class.timestamp(), "barbar":(DateUtils.class.timestamp() - 2 * AlarmManager.SENSORS_LOCK_TIME)};
        expect(alarmManager.sensorReadyForTriggering("barfoo")).to.be.true;
        expect(alarmManager.sensorReadyForTriggering("foobar")).to.be.false;
        expect(alarmManager.sensorReadyForTriggering("barbar")).to.be.true;
    });

    it("enableAlarm should really enable alarm and save status", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
        alarmManager.formConfiguration.data = {enabled:false};
        sinon.spy(alarmManager.formConfiguration, "save");
        sinon.spy(alarmManager, "registerTile");
        sinon.spy(alarmManager, "armAlarm");
        alarmManager.enableAlarm();
        expect(alarmManager.formConfiguration.save.calledTwice).to.be.true;
        expect(alarmManager.registerTile.calledOnce).to.be.true;
        expect(alarmManager.formConfiguration.data.enabled).to.be.true;
        expect(alarmManager.armAlarm.calledOnce).to.be.true;
        alarmManager.formConfiguration.save.restore();
        alarmManager.registerTile.restore();
        alarmManager.armAlarm.restore();
    });

    it("enableAlarm should not enable alarm because that was already the case", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
        alarmManager.formConfiguration.data = {enabled:true};
        sinon.spy(alarmManager.formConfiguration, "save");
        sinon.spy(alarmManager, "registerTile");
        sinon.spy(alarmManager, "armAlarm");
        alarmManager.enableAlarm();
        expect(alarmManager.formConfiguration.save.calledOnce).to.be.false;
        expect(alarmManager.registerTile.calledOnce).to.be.false;
        expect(alarmManager.formConfiguration.data.enabled).to.be.true;
        expect(alarmManager.armAlarm.calledOnce).to.be.false;
        alarmManager.formConfiguration.save.restore();
        alarmManager.registerTile.restore();
        alarmManager.armAlarm.restore();
    });

    it("disableAlarm should really disable alarm and save status", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
        alarmManager.formConfiguration.data = {enabled:true};
        sinon.spy(alarmManager.formConfiguration, "save");
        sinon.spy(alarmManager, "registerTile");
        sinon.spy(alarmManager, "armCancel");
        alarmManager.disableAlarm();
        expect(alarmManager.formConfiguration.save.calledTwice).to.be.true;
        expect(alarmManager.registerTile.calledOnce).to.be.true;
        expect(alarmManager.formConfiguration.data.enabled).to.be.false;
        expect(alarmManager.armCancel.calledOnce).to.be.true;
        alarmManager.formConfiguration.save.restore();
        alarmManager.registerTile.restore();
        alarmManager.armCancel.restore();
    });

    it("disableAlarm should not disable alarm because that was already the case", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
        alarmManager.formConfiguration.data = {enabled:false};
        sinon.spy(alarmManager.formConfiguration, "save");
        sinon.spy(alarmManager, "registerTile");
        sinon.spy(alarmManager, "armCancel");
        alarmManager.disableAlarm();
        expect(alarmManager.formConfiguration.save.calledOnce).to.be.false;
        expect(alarmManager.registerTile.calledOnce).to.be.false;
        expect(alarmManager.formConfiguration.data.enabled).to.be.false;
        expect(alarmManager.armCancel.calledOnce).to.be.false;
        alarmManager.formConfiguration.save.restore();
        alarmManager.registerTile.restore();
        alarmManager.armCancel.restore();
    });

    it("triggerAlarm should trigger alarm", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
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
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
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
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
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
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
        alarmManager.formConfiguration.data = {id:1503493095302,enabled:false,userLocationTrigger:true,sensors:[{sensor:{identifier:1501240500},triggerAlarm:true}],devicesOnEnable:[{identifier:1981,status:"on"}],devicesOnDisable:[{identifier:1982,status:"off"}]};
        alarmManager.alarmTriggered = false;

        const spy = sinon.spy(core.deviceManager, "switchDevice");
        alarmManager.stopAlarm();
        expect(core.deviceManager.switchDevice.calledOnce).to.be.false;
        expect(alarmManager.alarmTriggered).to.be.false;
        core.deviceManager.switchDevice.restore();
    });

    it("armAlarm should process several small operations", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
        alarmManager.formConfiguration.data = {};
        sinon.spy(alarmManager, "armCancel");
        sinon.spy(schedulerService, "schedule");
        alarmManager.armAlarm();
        expect(alarmManager.armCancel.calledOnce).to.be.true;
        expect(schedulerService.schedule.calledOnce).to.be.true;
        alarmManager.armCancel.restore();
        schedulerService.schedule.restore();
    });

    it("armCancel should process several small operations", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
        alarmManager.formConfiguration.data = {armed:true};
        sinon.spy(alarmManager.formConfiguration, "save");
        sinon.spy(schedulerService, "cancel");
        alarmManager.armCancel();
        expect(alarmManager.formConfiguration.save.calledOnce).to.be.true;
        expect(alarmManager.formConfiguration.data.armed).to.be.false;
        expect(schedulerService.cancel.calledOnce).to.be.true;
        alarmManager.formConfiguration.save.restore();
        schedulerService.cancel.restore();
    });

    // More functional tests

    it("userLocationTrigger disabled should not enable alarm", function() {
        sinon.stub(core.userManager, "nobodyAtHome").returns(true);
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
        alarmManager.formConfiguration.data = {enabled:false, userLocationTrigger:false};
        userManager.formConfiguration.data = [{username:"foobar", atHome:true}];
        userManager.setUserZone("foobar", true);
        expect(alarmManager.alarmStatus()).to.be.false;
        core.userManager.nobodyAtHome.restore();
    });

    it("userLocationTrigger enabled should enable alarm", function() {
        sinon.stub(core.userManager, "nobodyAtHome").returns(true);
        sinon.stub(core.userManager, "somebodyAtHome").returns(false);
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
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
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
        alarmManager.formConfiguration.data = {enabled:true, userLocationTrigger:true};
        userManager.formConfiguration.data = [{username:"foobar", atHome:false}];
        userManager.setUserZone("foobar", true);
        expect(alarmManager.alarmStatus()).to.be.false;
        core.userManager.nobodyAtHome.restore();
        core.userManager.somebodyAtHome.restore();
    });

    it("sensor signal should enable pre-alarm", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
        alarmManager.formConfiguration.data = {id:1503493095302,enabled:true,armed:true,userLocationTrigger:true,sensors:[{sensor:{identifier:1501240500},triggerAlarm:false}],devicesOnEnable:[{identifier:1981,status:"on"}],devicesOnDisable:[{identifier:1982,status:"off"}]};
        sinon.spy(messageManager, "sendMessage");
        sinon.spy(alarmManager, "triggerAlarm");
        sinon.spy(alarmManager, "sensorReadyForTriggering");
        sensorsManager.onNewSensorValue(1501240500, "foobar", 0, 0, 0, 0, "bar");
        expect(alarmManager.alarmTriggered).to.be.false;
        expect(messageManager.sendMessage.calledOnce).to.be.true;
        expect(alarmManager.triggerAlarm.calledOnce).to.be.false;
        expect(alarmManager.sensorReadyForTriggering.calledOnce).to.be.true;
        messageManager.sendMessage.restore();
        alarmManager.triggerAlarm.restore();
        alarmManager.sensorReadyForTriggering.restore();
    });

    it("sensor signal should NOT enable pre-alarm", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
        alarmManager.formConfiguration.data = {id:1503493095302,enabled:true,armed:true,userLocationTrigger:true,sensors:[{sensor:{identifier:1501240500},triggerAlarm:false}],devicesOnEnable:[{identifier:1981,status:"on"}],devicesOnDisable:[{identifier:1982,status:"off"}]};
        sinon.spy(messageManager, "sendMessage");
        sinon.spy(alarmManager, "triggerAlarm");
        sinon.spy(alarmManager, "sensorReadyForTriggering");
        sensorsManager.onNewSensorValue(1501240501, "foobar", 0, 0, 0, 0, "bar");
        expect(alarmManager.alarmTriggered).to.be.false;
        expect(messageManager.sendMessage.calledOnce).to.be.false;
        expect(alarmManager.triggerAlarm.calledOnce).to.be.false;
        expect(alarmManager.sensorReadyForTriggering.calledOnce).to.be.false;
        messageManager.sendMessage.restore();
        alarmManager.triggerAlarm.restore();
        alarmManager.sensorReadyForTriggering.restore();
    });

    it("sensor signal should trigger alarm", function() {
        alarmManager = new AlarmManager.class(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager);
        alarmManager.formConfiguration.data = {id:1503493095302,enabled:true,armed:true,userLocationTrigger:true,sensors:[{sensor:{identifier:1501240500},triggerAlarm:true}],devicesOnEnable:[{identifier:1981,status:"on"}],devicesOnDisable:[{identifier:1982,status:"off"}]};
        sinon.spy(messageManager, "sendMessage");
        sinon.spy(alarmManager, "triggerAlarm");
        sinon.spy(alarmManager, "sensorReadyForTriggering");
        sensorsManager.onNewSensorValue(1501240500, "foobar", 0, 0, 0, 0, "bar");
        expect(alarmManager.alarmTriggered).to.be.true;
        expect(messageManager.sendMessage.calledTwice).to.be.true;
        expect(alarmManager.triggerAlarm.calledOnce).to.be.true;
        expect(alarmManager.sensorReadyForTriggering.calledOnce).to.be.true;
        messageManager.sendMessage.restore();
        alarmManager.triggerAlarm.restore();
        alarmManager.sensorReadyForTriggering.restore();
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
        schedulerService = null;
    });
});
