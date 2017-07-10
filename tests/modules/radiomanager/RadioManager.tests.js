/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

const HautomationCore = require("../../../src/HautomationCore");
const core = new HautomationCore();
const RadioManager = require("./../../../src/modules/radiomanager/RadioManager");
let radioManager = core.radioManager;
const formManager = core.formManager;
const pluginsManager = core.pluginsManager;
const sampleRadioPluginIdentifier = "rflink";

describe("RadioManager", function() {
    before(() => {

    });

    it("constructor should call several methods for intialization", function() {
        sinon.spy(RadioManager.class.prototype, "getModules");
        sinon.spy(RadioManager.class.prototype, "getProtocols");
        sinon.spy(RadioManager.class.prototype, "registerRadioEvents");
        sinon.spy(core.formManager, "register");
        radioManager = new RadioManager.class(pluginsManager, formManager);
        expect(RadioManager.class.prototype.getModules.calledOnce).to.be.true;
        expect(RadioManager.class.prototype.getProtocols.calledOnce).to.be.true;
        expect(RadioManager.class.prototype.registerRadioEvents.calledOnce).to.be.true;
        expect(core.formManager.register.calledTwice).to.be.true;
        RadioManager.class.prototype.getModules.restore();
        RadioManager.class.prototype.getProtocols.restore();
        RadioManager.class.prototype.registerRadioEvents.restore();
        core.formManager.register.restore();
    });

    it("registerRadioEvents should call getPlugins", function() {
        sinon.spy(pluginsManager, "getPluginsByCategory");
        radioManager.registerRadioEvents();
        expect(pluginsManager.getPluginsByCategory.withArgs("radio").calledOnce).to.be.true;
        pluginsManager.getPluginsByCategory.restore();
    });

    it("getModules should call getPlugins", function() {
        sinon.spy(pluginsManager, "getPluginsByCategory");
        sinon.spy(formManager, "register");
        radioManager.getModules();
        expect(pluginsManager.getPluginsByCategory.withArgs("radio").calledOnce).to.be.true;
        expect(formManager.register.calledOnce).to.be.true;
        expect(radioManager.modules.length > 0).to.be.true;
        pluginsManager.getPluginsByCategory.restore();
        formManager.register.restore();
    });

    it("getProtocols should call getPlugins", function() {
        sinon.spy(pluginsManager, "getPluginsByCategory");
        radioManager.getProtocols();
        expect(pluginsManager.getPluginsByCategory.withArgs("radio").calledOnce).to.be.true;
        pluginsManager.getPluginsByCategory.restore();
    });

    it("radio event should refresh protocols", function() {
        sinon.spy(radioManager, "getProtocols");
        radioManager.onRadioEvent({protocol:"foobarfoo"});
        expect(radioManager.getProtocols.calledOnce).to.be.true;
        radioManager.getProtocols.restore();
    });

    // More functional test
    // Emit
    it("switch device should call the emit function", function() {
        const radioPlugin = pluginsManager.getPluginByIdentifier(sampleRadioPluginIdentifier);
        sinon.spy(radioPlugin.instance, "emit");
        sinon.stub(radioPlugin.instance.service, "send");

        const res = radioManager.switchDevice(sampleRadioPluginIdentifier, "foobar", "foo", "bar", 0.2, null, -1);

        expect(radioPlugin.instance.emit.withArgs(null, "foobar", "foo", "bar", 0.2, -1).calledOnce).to.be.true;
        expect(res.frequency).to.be.equal(radioPlugin.instance.defaultFrequency());
        expect(res.protocol).to.be.equal("foobar");
        expect(res.deviceId).to.be.equal("foo");
        expect(res.switchId).to.be.equal("bar");
        expect(res.status).to.be.equal(0.2);

        radioPlugin.instance.emit.restore();
        radioPlugin.instance.service.send.restore();
    });

    // Receive
    it("switch device should call the emit function", function(done) {
        const radioPlugin = pluginsManager.getPluginByIdentifier(sampleRadioPluginIdentifier);
        sinon.stub(radioManager, "onRadioEvent").callsFake((radioObject) => {
            expect(radioObject.frequency).to.be.equal(radioPlugin.instance.defaultFrequency());
            expect(radioObject.protocol).to.be.equal("foobar");
            expect(radioObject.deviceId).to.be.equal("foo");
            expect(radioObject.switchId).to.be.equal("bar");
            expect(radioObject.status).to.be.equal(radioPlugin.instance.constants().STATUS_ON);
            done();
        });

        radioPlugin.instance.onRflinkReceive({protocol:"foobar", code:"foo", subcode:"bar", status:"ON"});

        expect(radioManager.onRadioEvent.calledOnce).to.be.true;

        radioManager.onRadioEvent.restore();
    });


    after(() => {

    });
});
