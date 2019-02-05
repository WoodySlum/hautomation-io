/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var GlobalMocks = require("./../../GlobalMocks");
var FormObject = require("../../../src/modules/formmanager/FormObject");
var DeviceManager = require("../../../src/modules/devicemanager/DeviceManager");

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
      "RadioForm":[
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

const devicesWithBrightnessColor = [
  {
     "id":2018,
     "name":"BarFoo",
     "excludeFromAll":null,
     "visible":true,
     "worksOnlyOnDayNight":null,
     "icon":{
        "icon":59398
     },
     "TestDeviceForm":{
         "test":"FooBar"
     },
     "status":1
  }
];

const devicesWithColorTemperature = [
  {
     "id":2018,
     "name":"BarFoo",
     "excludeFromAll":null,
     "visible":true,
     "worksOnlyOnDayNight":null,
     "icon":{
        "icon":59398
     },
     "TestDeviceForm":{
         "test":"FooBar"
     },
     "status":1,
     "colorTemperature": 0.8
  }
];

const devicesWithChanges = [
  {
     "id":2018,
     "name":"BarFoo",
     "excludeFromAll":null,
     "visible":true,
     "worksOnlyOnDayNight":null,
     "icon":{
        "icon":59398
     },
     "TestDeviceForm":{
         "test":"FooBar"
     },
     "status":1,
     "colorTemperature": 0.8
  }
];

class TestDeviceForm extends FormObject.class {
    constructor(id, test) {
        super(id);

        /**
         * @Property("test");
         * @Type("string");
         * @Title("test");
         */
        this.test = test;
    }

    json(data) {
        return new TestDeviceForm(data.id, data.test);
    }
}

const switchCallback = (device, formData, deviceStatus) => {
    return deviceStatus;
};

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
        devices[0].status = 1;
        sinon.stub(deviceManager.formConfiguration, "saveConfig").callsFake((data) => {
            expect(data.status).to.be.equal(-1);
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

    it("registerSwitchDevice should throw exception due to addForm not previously called", function() {
        try {
            deviceManager.registerSwitchDevice("foo", switchCallback);
            expect(false).to.be.true;
        } catch(e) {
            expect(true).to.be.true;
        }
    });

    it("addForm should set correctly stuff", function() {
        core.formManager.register(TestDeviceForm);
        sinon.spy(core.formManager, "addAdditionalFields");
        deviceManager.addForm("foo", TestDeviceForm);
        expect(core.formManager.addAdditionalFields.calledOnce).to.be.true;
        expect(deviceManager.switchDeviceModules.foo).to.be.not.null;
        expect(deviceManager.switchDeviceModules.foo.formName).to.be.equals("TestDeviceForm");
        core.formManager.addAdditionalFields.restore();
    });

    it("registerSwitchDevice should set correctly stuff", function() {
        deviceManager.registerSwitchDevice("foo", switchCallback, DeviceManager.DEVICE_TYPE_LIGHT_DIMMABLE_COLOR);
        expect(deviceManager.switchDeviceModules.foo.switch).to.be.equal(switchCallback);
        expect(deviceManager.switchDeviceModules.foo.type).to.be.equal(DeviceManager.DEVICE_TYPE_LIGHT_DIMMABLE_COLOR);
    });

    it("switchDevice should change color and brightness", function() {
        deviceManager.formConfiguration.data = devicesWithBrightnessColor;
        sinon.spy(deviceManager.switchDeviceModules.foo, "switch");
        deviceManager.switchDevice(2018, "Off", 0.5, "FEFEFE");
        expect(deviceManager.switchDeviceModules.foo.switch.calledOnce).to.be.true;
        expect(deviceManager.formConfiguration.data[0].id).to.be.equal(2018);
        expect(deviceManager.formConfiguration.data[0].status).to.be.equal(-1);
        expect(deviceManager.formConfiguration.data[0].brightness).to.be.equal(0.5);
        expect(deviceManager.formConfiguration.data[0].color).to.be.equal("FEFEFE");
        deviceManager.switchDeviceModules.foo.switch.restore();
    });

    it("switchDevice should change color temperature only", function() {
        deviceManager.formConfiguration.data = devicesWithColorTemperature;
        sinon.spy(deviceManager.switchDeviceModules.foo, "switch");
        deviceManager.switchDevice(2018, "On", 0.5, "FEFEFE", 0.23);
        expect(deviceManager.switchDeviceModules.foo.switch.calledOnce).to.be.true;
        expect(deviceManager.formConfiguration.data[0].id).to.be.equal(2018);
        expect(deviceManager.formConfiguration.data[0].status).to.be.equal(1);
        expect(deviceManager.formConfiguration.data[0].colorTemperature).to.be.equal(0.23);
        deviceManager.switchDeviceModules.foo.switch.restore();
    });

    it("switchDevice should whant changed", function(done) {
        deviceManager.formConfiguration.data = devicesWithChanges;
        deviceManager.registerSwitchDevice("foo", (device, formData, deviceStatus) => {
            expect(deviceStatus.changes.indexOf(DeviceManager.ITEM_CHANGE_STATUS) > -1).to.be.true;
            expect(deviceStatus.changes.indexOf(DeviceManager.ITEM_CHANGE_BRIGHTNESS) > -1).to.be.true;
            expect(deviceStatus.changes.indexOf(DeviceManager.ITEM_CHANGE_COLOR) > -1).to.be.true;
            expect(deviceStatus.changes.indexOf(DeviceManager.ITEM_CHANGE_COLOR_TEMP) > -1).to.be.true;
            done();
        }, DeviceManager.DEVICE_TYPE_LIGHT_DIMMABLE_COLOR);
        deviceManager.switchDevice(2018, "Off", 0.5, "FF0000", 0.23);
    });

    it("getSupportedModes should send correct value", function() {
        expect(deviceManager.getDeviceTypes(devices[0]).length).to.be.equal(1);
        expect(deviceManager.getDeviceTypes(devices[0])[0]).to.be.equal(DeviceManager.DEVICE_TYPE_LIGHT);
    });

    it("switchDevice on should trigger scenario", function() {
        sinon.stub(core.scenarioManager, "getScenarios").callsFake(() => {
            return [{
                id:1,
                DevicesListScenarioForm: {
                    triggerOnDevice:[
                        {identifier:2,status:"on"}
                    ]
                }
            }];
        });
        sinon.stub(core.scenarioManager, "triggerScenario").callsFake(() => {});
        deviceManager.switchDevice(2, DeviceManager.STATUS_ON);
        expect(core.scenarioManager.triggerScenario.calledOnce).to.be.true;

        core.scenarioManager.getScenarios.restore();
        core.scenarioManager.triggerScenario.restore();
    });

    it("switchDevice off should trigger scenario", function() {
        sinon.stub(core.scenarioManager, "getScenarios").callsFake(() => {
            return [{
                id:1,
                DevicesListScenarioForm: {
                    triggerOnDevice:[
                        {identifier:3,status:"off"}
                    ]
                }
            }];
        });
        sinon.stub(core.scenarioManager, "triggerScenario").callsFake(() => {});
        deviceManager.switchDevice(3, DeviceManager.INT_STATUS_OFF);
        expect(core.scenarioManager.triggerScenario.calledOnce).to.be.true;

        core.scenarioManager.getScenarios.restore();
        core.scenarioManager.triggerScenario.restore();
    });

    it("switchDevice ignore should trigger scenario", function() {
        sinon.stub(core.scenarioManager, "getScenarios").callsFake(() => {
            return [{
                id:1,
                DevicesListScenarioForm: {
                    triggerOnDevice:[
                        {identifier:4,status:"ignore"}
                    ]
                }
            }];
        });
        sinon.stub(core.scenarioManager, "triggerScenario").callsFake(() => {});
        deviceManager.switchDevice(4, DeviceManager.STATUS_ON);
        deviceManager.switchDevice(4, DeviceManager.STATUS_OFF);
        expect(core.scenarioManager.triggerScenario.calledTwice).to.be.true;

        core.scenarioManager.getScenarios.restore();
        core.scenarioManager.triggerScenario.restore();
    });

    it("switchDevice should not trigger scenario", function() {
        sinon.stub(core.scenarioManager, "getScenarios").callsFake(() => {
            return [{
                id:1,
                DevicesListScenarioForm: {
                    triggerOnDevice:[
                        {identifier:5,status:"off"}
                    ]
                }
            }];
        });
        sinon.stub(core.scenarioManager, "triggerScenario").callsFake(() => {});
        deviceManager.switchDevice(4, DeviceManager.STATUS_ON);
        expect(core.scenarioManager.triggerScenario.notCalled).to.be.true;

        core.scenarioManager.getScenarios.restore();
        core.scenarioManager.triggerScenario.restore();
    });


    after(() => {
        radioPlugin.instance.service.send.restore();
    });
});
