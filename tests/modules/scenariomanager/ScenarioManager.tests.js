/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

const FormObject = require("./../../../src/modules/formmanager/FormObject");
const HautomationCore = require("./../../../src/HautomationCore").class;
const DateUtils = require("../../../src/utils/DateUtils");
const RadioScenarioForm = require("./../../../src/modules/radiomanager/RadioScenarioForm");
let core;
const ScenarioManager = require("./../../../src/modules/scenariomanager/ScenarioManager");
let confManager;
let formManager;
let webServices;
let timeEventService;
let schedulerService;
let scenarioManager;

class ScenarioSampleForm extends FormObject.class {
    constructor(id, text) {
        super(id);
        /**
         * @Property("text");
         * @Type("string");
         * @Title("A text field");
         */
        this.text = text;
    }

    json(data) {
        return new ScenarioSampleForm(data.id, data.text);
    }
}


describe("ScenarioManager", function() {
    beforeEach(() => {
        core = new HautomationCore();
        confManager = core.confManager;
        formManager = core.formManager;
        webServices = core.webServices;
        timeEventService = core.timeEventService;
        schedulerService = core.schedulerService;
    });

    it("constructor should call several methods for intialization", function() {
        sinon.spy(core.formManager, "register");
        sinon.spy(core.timeEventService, "register");
        sinon.spy(core.schedulerService, "register");
        scenarioManager = new ScenarioManager.class(confManager, formManager, webServices, timeEventService, schedulerService);
        expect(core.formManager.register.callCount === 4).to.be.true;
        expect(core.timeEventService.register.calledOnce).to.be.true;
        expect(core.schedulerService.register.calledOnce).to.be.true;
        expect(Object.keys(scenarioManager.registered).length).to.be.equal(0);
        core.formManager.register.restore();
        core.timeEventService.register.restore();
        core.schedulerService.register.restore();
    });

    it("register should really save locally the registration object", function() {
        scenarioManager = new ScenarioManager.class(confManager, formManager, webServices, timeEventService, schedulerService);
        sinon.spy(core.formManager, "register");
        const cb = (scenario) => {

        };
        scenarioManager.register(ScenarioSampleForm, cb, "test.title");
        expect(core.formManager.register.calledOnce).to.be.true;
        expect(Object.keys(scenarioManager.registered).length).to.be.equal(1);
        expect (scenarioManager.registered["277ab8e05feec964402c3b8025730802caa627a0a16fe3714fc894b51c83990b"].triggerCb).to.be.equal(cb);
        expect (scenarioManager.registered["277ab8e05feec964402c3b8025730802caa627a0a16fe3714fc894b51c83990b"].formPart).to.be.equal(ScenarioSampleForm);
        core.formManager.register.restore();
    });

    it("unregister should remove object", function() {
        scenarioManager = new ScenarioManager.class(confManager, formManager, webServices, timeEventService, schedulerService);
        const cb = (scenario) => {

        };
        scenarioManager.register(ScenarioSampleForm, cb, "test.title");
        scenarioManager.unregister(ScenarioSampleForm, cb);
        expect(Object.keys(scenarioManager.registered).length).to.be.equal(0);
    });

    // More functional tests !

    it("radio event should trigger scenario", function() {
        const scenarioManager = core.scenarioManager;
        scenarioManager.formConfiguration.data = [{id:1503304879528,name:"Test multi radio",enabled:true,icon:{icon:"e806"},RadioScenariosForm:{radioScenariosForm:[{radio:{module:"rflink",protocol:"foobar",deviceId:"foo",switchId:"bar"},status:1},{radio:{module:"rflink",protocol:"barfoo",deviceId:"bar",switchId:"foo"},status:RadioScenarioForm.STATUS_ALL}]},DevicesListScenarioForm:{devices:[{identifier:1981,status:"on"}]}}];
        const radioObjSim = {
            module:"rflink",
            protocol:"foobar",
            deviceId:"foo",
            switchId:"bar",
            status:1
        };
        cbCalled = false;
        const cb = (scenario) => {
            cbCalled = true;
        };
        scenarioManager.register(ScenarioSampleForm, cb, "test.title");

        sinon.spy(scenarioManager, "triggerScenario");
        core.radioManager.onRadioEvent(radioObjSim);
        expect(scenarioManager.triggerScenario.calledOnce).to.be.true;
        expect(cbCalled).to.be.true;
        scenarioManager.triggerScenario.restore();
        scenarioManager.unregister(ScenarioSampleForm, cb);
    });

    it("radio event should NOT trigger scenario (unknown radio event)", function() {
        const scenarioManager = core.scenarioManager;
        scenarioManager.formConfiguration.data = [{id:1503304879528,name:"Test multi radio",enabled:false,icon:{icon:"e806"},RadioScenariosForm:{radioScenariosForm:[{radio:{module:"rflink",protocol:"foobar",deviceId:"foo",switchId:"bar"},status:1},{radio:{module:"rflink",protocol:"barfoo",deviceId:"bar",switchId:"foo"},status:RadioScenarioForm.STATUS_ALL}]},DevicesListScenarioForm:{devices:[{identifier:1981,status:"on"}]}}];
        const radioObjSim = {
            module:"rflink",
            protocol:"foobar",
            deviceId:"foobar",
            switchId:"bar",
            status:1
        };
        cbCalled = false;
        const cb = (scenario) => {
            cbCalled = true;
        };
        scenarioManager.register(ScenarioSampleForm, cb, "test.title");

        sinon.spy(scenarioManager, "triggerScenario");
        core.radioManager.onRadioEvent(radioObjSim);
        expect(scenarioManager.triggerScenario.calledOnce).to.be.false;
        expect(cbCalled).to.be.false;
        scenarioManager.triggerScenario.restore();
        scenarioManager.unregister(ScenarioSampleForm, cb);
    });

    it("radio event should NOT trigger scenario (disabled action)", function() {
        const scenarioManager = core.scenarioManager;
        scenarioManager.formConfiguration.data = [{id:1503304879528,name:"Test multi radio",enabled:false,icon:{icon:"e806"},RadioScenariosForm:{radioScenariosForm:[{radio:{module:"rflink",protocol:"foobar",deviceId:"foo",switchId:"bar"},status:1},{radio:{module:"rflink",protocol:"barfoo",deviceId:"bar",switchId:"foo"},status:RadioScenarioForm.STATUS_ALL}]},DevicesListScenarioForm:{devices:[{identifier:1981,status:"on"}]}}];
        const radioObjSim = {
            module:"rflink",
            protocol:"foobar",
            deviceId:"foo",
            switchId:"bar",
            status:1
        };
        cbCalled = false;
        const cb = (scenario) => {
            cbCalled = true;
        };
        scenarioManager.register(ScenarioSampleForm, cb, "test.title");

        sinon.spy(scenarioManager, "triggerScenario");
        core.radioManager.onRadioEvent(radioObjSim);
        expect(scenarioManager.triggerScenario.calledOnce).to.be.true;
        expect(cbCalled).to.be.false;
        scenarioManager.triggerScenario.restore();
        scenarioManager.unregister(ScenarioSampleForm, cb);
    });

    it("radio event should trigger scenario only once", function() {
        const scenarioManager = core.scenarioManager;
        scenarioManager.formConfiguration.data = [{id:1503304879528,name:"Test multi radio",enabled:true,icon:{icon:"e806"},RadioScenariosForm:{radioScenariosForm:[{radio:{module:"rflink",protocol:"foobar",deviceId:"foo",switchId:"bar"},status:1},{radio:{module:"rflink",protocol:"foobar",deviceId:"foo",switchId:"bar"},status:RadioScenarioForm.STATUS_ALL}]},DevicesListScenarioForm:{devices:[{identifier:1981,status:"on"}]}}];
        const radioObjSim = {
            module:"rflink",
            protocol:"foobar",
            deviceId:"foo",
            switchId:"bar",
            status:1
        };
        cbCalledCount = 0;
        const cb = (scenario) => {
            cbCalledCount++;
        };
        scenarioManager.register(ScenarioSampleForm, cb, "test.title");

        sinon.spy(scenarioManager, "triggerScenario");
        core.radioManager.onRadioEvent(radioObjSim);
        expect(scenarioManager.triggerScenario.calledOnce).to.be.true;
        expect(cbCalledCount).to.be.equal(1);
        scenarioManager.triggerScenario.restore();
        scenarioManager.unregister(ScenarioSampleForm, cb);
    });

    it("radio event should NOT trigger scenario due to status", function() {
        const scenarioManager = core.scenarioManager;
        scenarioManager.formConfiguration.data = [{id:1503304879528,name:"Test multi radio",enabled:true,icon:{icon:"e806"},RadioScenariosForm:{radioScenariosForm:[{radio:{module:"rflink",protocol:"foobar",deviceId:"foo",switchId:"bar"},status:1}]},DevicesListScenarioForm:{devices:[{identifier:1981,status:"on"}]}}];
        const radioObjSim = {
            module:"rflink",
            protocol:"foobar",
            deviceId:"foo",
            switchId:"bar",
            status:-1
        };
        cbCalled = false;
        const cb = (scenario) => {
            cbCalled = true;
        };
        scenarioManager.register(ScenarioSampleForm, cb, "test.title");

        sinon.spy(scenarioManager, "triggerScenario");
        core.radioManager.onRadioEvent(radioObjSim);
        expect(scenarioManager.triggerScenario.calledOnce).to.be.false;
        expect(cbCalled).to.be.false;
        scenarioManager.triggerScenario.restore();
        scenarioManager.unregister(ScenarioSampleForm, cb);
    });

    it("radio event should trigger scenario with all status", function() {
        const scenarioManager = core.scenarioManager;
        scenarioManager.formConfiguration.data = [{id:1503304879528,name:"Test multi radio",enabled:true,icon:{icon:"e806"},RadioScenariosForm:{radioScenariosForm:[{radio:{module:"rflink",protocol:"foobar",deviceId:"foo",switchId:"bar"},status:RadioScenarioForm.STATUS_ALL}]},DevicesListScenarioForm:{devices:[{identifier:1981,status:"on"}]}}];
        const radioObjSim = {
            module:"rflink",
            protocol:"foobar",
            deviceId:"foo",
            switchId:"bar",
            status:-1
        };
        cbCalled = false;
        const cb = (scenario) => {
            cbCalled = true;
        };
        scenarioManager.register(ScenarioSampleForm, cb, "test.title");

        sinon.spy(scenarioManager, "triggerScenario");
        core.radioManager.onRadioEvent(radioObjSim);
        expect(scenarioManager.triggerScenario.calledOnce).to.be.true;
        expect(cbCalled).to.be.true;
        scenarioManager.triggerScenario.restore();
        scenarioManager.unregister(ScenarioSampleForm, cb);
    });

    it("radio event should trigger specific radio device", function() {
        const scenarioManager = core.scenarioManager;
        scenarioManager.formConfiguration.data = [{id:1503304879528,name:"Test multi radio",enabled:true,icon:{icon:"e806"},RadioScenariosForm:{radioScenariosForm:[{radio:{module:"rflink",protocol:"foobar",deviceId:"foo",switchId:"bar"},status:RadioScenarioForm.STATUS_ALL}]},DevicesListScenarioForm:{devices:[{identifier:1981,status:"on"}]}}];
        const radioObjSim = {
            module:"rflink",
            protocol:"foobar",
            deviceId:"foo",
            switchId:"bar",
            status:-1
        };

        sinon.spy(core.deviceManager, "switchDevice");
        core.radioManager.onRadioEvent(radioObjSim);
        expect(core.deviceManager.switchDevice.calledOnce).to.be.true;
        core.deviceManager.switchDevice.restore();
    });

    it("sub actions should be correctly executed", function() {
        const scenarioManager = core.scenarioManager;
        scenarioManager.formConfiguration.data = [{id:1503304879528,name:"Test multi radio",enabled:true,icon:{icon:"e806"},subActions:[{scenario:{scenario:1503304879529},delay:1}],RadioScenariosForm:{radioScenariosForm:[{radio:{module:"rflink",protocol:"foobar",deviceId:"foo",switchId:"bar"},status:RadioScenarioForm.STATUS_ALL}]}},{id:1503304879529,name:"Test sub action",enabled:true,icon:{icon:"e806"},RadioScenariosForm:{radioScenariosForm:[]},DevicesListScenarioForm:{devices:[{identifier:1981,status:"on"}]}}];
        const radioObjSim = {
            module:"rflink",
            protocol:"foobar",
            deviceId:"foo",
            switchId:"bar",
            status:-1
        };

        sinon.spy(core.deviceManager, "switchDevice");
        const spy = sinon.spy(core.schedulerService, "schedule");
        core.radioManager.onRadioEvent(radioObjSim);


        expect(core.schedulerService.schedule.calledOnce).to.be.true;
        expect(spy.args[0][0]).to.be.equal("sub-action");
        expect(DateUtils.class.timestamp() - spy.args[0][1]).to.be.below(5);
        expect(spy.args[0][2].scenarioId).to.be.equal(1503304879529);

        core.schedulerService.registeredElements["1da7a0d62030e953333afc78f213d62b4e9567237f4a63af3a542bdc3cb4d5d0"](spy.args[0][2]);
        expect(core.deviceManager.switchDevice.calledOnce).to.be.true;

        core.deviceManager.switchDevice.restore();
        core.schedulerService.schedule.restore();
    });

    afterEach(() => {
        core = null;
        confManager = null;
        formManager = null;
        webServices = null;
        timeEventService = null;
        schedulerService = null;
    });
});
