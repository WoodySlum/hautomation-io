/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

const HautomationCore = require("./../../../src/HautomationCore").class;

const core = new HautomationCore();
const deviceManager = core.deviceManager;
const radioManager = core.radioManager;
const sampleRadioPluginIdentifier = "rflink";
const radioPlugin = core.pluginsManager.getPluginByIdentifier(sampleRadioPluginIdentifier);

const devices = [
   {
      "id":1981,
      "name":"FooBar",
      "excludeFromAll":null,
      "visible":true,
      "worksOnlyOnDayNight":null,
      "icon":{
         "icon":59398
      },
      "radio":[
         {
            "module":sampleRadioPluginIdentifier,
            "protocol":"protocol1",
            "deviceId":"dev1",
            "switchId":"sw1"
         },
         {
             "module":sampleRadioPluginIdentifier,
             "protocol":"protocol1",
             "deviceId":"dev1",
             "switchId":"sw1"
         }
      ],
      "status":1
   }
];

describe("DeviceManager", function() {
    before(() => {
        sinon.stub(radioPlugin.instance.service, "send");
        deviceManager.formConfiguration.data = devices;
    });

    // Functional tests
    it("switchDevice should call twice send radio", function() {
        sinon.spy(radioManager, "switchDevice");
        deviceManager.switchDevice(1981, "On");
        expect(radioManager.switchDevice.calledTwice).to.be.true;
        radioManager.switchDevice.restore();
    });

    it("switchDevice should save status", function(done) {
        sinon.stub(deviceManager.formConfiguration, "saveConfig").callsFake((data) => {
            expect(data.status).to.be.equal(radioPlugin.instance.constants().STATUS_ON);
            done();
        });
        deviceManager.switchDevice(1981, "On");
        expect(deviceManager.formConfiguration.saveConfig.calledOnce).to.be.true;
        deviceManager.formConfiguration.saveConfig.restore();
    });

    it("switchDevice should transform understandable status", function(done) {
        sinon.stub(deviceManager.formConfiguration, "saveConfig").callsFake((data) => {
            expect(data.status).to.be.equal(radioPlugin.instance.constants().STATUS_OFF);
            done();
        });
        deviceManager.switchDevice(1981, "Off");
        deviceManager.formConfiguration.saveConfig.restore();
    });

    it("switchDevice should invert status", function(done) {
        devices[0].status = 1;
        sinon.stub(deviceManager.formConfiguration, "saveConfig").callsFake((data) => {
            expect(data.status).to.be.equal(radioPlugin.instance.constants().STATUS_OFF);
            done();
        });
        deviceManager.switchDevice(1981);
        deviceManager.formConfiguration.saveConfig.restore();
    });

    it("switchDevice should invert status with specific value", function(done) {
        devices[0].status = 0.2;
        sinon.stub(deviceManager.formConfiguration, "saveConfig").callsFake((data) => {
            expect(data.status).to.be.equal(-0.2);
            done();
        });
        deviceManager.switchDevice(1981);
        deviceManager.formConfiguration.saveConfig.restore();
    });

    it("switchDevice should update dashboard", function() {
        sinon.spy(deviceManager.dashboardManager, "registerTile");
        deviceManager.switchDevice(1981, "Off");
        expect(deviceManager.dashboardManager.registerTile.calledOnce).to.be.true;
        deviceManager.dashboardManager.registerTile.restore();
    });

    it("switchDevice should call twice send radio when night and set to day and night", function() {
        devices[0].worksOnlyOnDayNight = 1;
        sinon.spy(radioManager, "switchDevice");
        sinon.stub(core.environmentManager, "isNight").returns(true);
        deviceManager.switchDevice(1981, "On");
        expect(radioManager.switchDevice.calledTwice).to.be.true;
        radioManager.switchDevice.restore();
        core.environmentManager.isNight.restore();
    });

    it("switchDevice should call twice send radio when day and set to day", function() {
        devices[0].worksOnlyOnDayNight = 2;
        sinon.spy(radioManager, "switchDevice");
        sinon.stub(core.environmentManager, "isNight").returns(false);
        deviceManager.switchDevice(1981, "On");
        expect(radioManager.switchDevice.calledTwice).to.be.true;
        radioManager.switchDevice.restore();
        core.environmentManager.isNight.restore();
    });

    it("switchDevice should NOT call twice send radio when night and set to day", function() {
        devices[0].worksOnlyOnDayNight = 2;
        devices[0].status = -1;
        sinon.spy(radioManager, "switchDevice");
        sinon.stub(core.environmentManager, "isNight").returns(true);
        deviceManager.switchDevice(1981, "On");
        expect(radioManager.switchDevice.callCount > 0).to.be.false;
        radioManager.switchDevice.restore();
        core.environmentManager.isNight.restore();
    });

    it("switchDevice should call twice send radio when night and set to night", function() {
        devices[0].worksOnlyOnDayNight = 3;
        sinon.spy(radioManager, "switchDevice");
        sinon.stub(core.environmentManager, "isNight").returns(true);
        deviceManager.switchDevice(1981, "On");
        expect(radioManager.switchDevice.calledTwice).to.be.true;
        radioManager.switchDevice.restore();
        core.environmentManager.isNight.restore();
    });

    it("switchDevice should NOT call twice send radio when day and set to night", function() {
        devices[0].worksOnlyOnDayNight = 3;
        devices[0].status = -1;
        sinon.spy(radioManager, "switchDevice");
        sinon.stub(core.environmentManager, "isNight").returns(false);
        deviceManager.switchDevice(1981, "On");
        expect(radioManager.switchDevice.callCount > 0).to.be.false;
        radioManager.switchDevice.restore();
        core.environmentManager.isNight.restore();
    });

    it("switchDevice should call twice send radio because status is on, even if night mode is enabled", function() {
        devices[0].worksOnlyOnDayNight = 3;
        devices[0].status = 1;
        sinon.spy(radioManager, "switchDevice");
        sinon.stub(core.environmentManager, "isNight").returns(false);
        deviceManager.switchDevice(1981, "Off");
        expect(radioManager.switchDevice.calledTwice).to.be.true;
        radioManager.switchDevice.restore();
        core.environmentManager.isNight.restore();
    });

    it("switchDevice should call twice send radio because status is inverted", function() {
        devices[0].worksOnlyOnDayNight = 0;
        devices[0].status = 1;
        sinon.spy(radioManager, "switchDevice");
        deviceManager.switchDevice(1981, "InverT");
        expect(radioManager.switchDevice.calledTwice).to.be.true;
        expect(devices[0].status).to.be.equal(-1);
        radioManager.switchDevice.restore();
    });

    it("switchDevice should call twice send radio because status is inverted", function() {
        devices[0].worksOnlyOnDayNight = 0;
        devices[0].status = -1;
        sinon.spy(radioManager, "switchDevice");
        deviceManager.switchDevice(1981, "invert");
        expect(radioManager.switchDevice.calledTwice).to.be.true;
        expect(devices[0].status).to.be.equal(1);
        radioManager.switchDevice.restore();
    });

    after(() => {
        radioPlugin.instance.service.send.restore();
    });
});
