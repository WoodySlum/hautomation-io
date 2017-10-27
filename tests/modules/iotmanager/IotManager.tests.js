/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

const IotManager = require("./../../../src/modules/iotmanager/IotManager");
const HautomationCore = require("./../../../src/HautomationCore").class;
const core = new HautomationCore();
//constructor(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager) {

const appConfiguration = {};
const webServices = core.webServices;
const installationManager = core.installationManager;
const formManager = core.formManager;
const environmentManager = core.environmentManager;
const confManager = core.confManager;

describe("IotManager", function() {
    before(() => {

    });

    it("constructor should initialize stuff correctly", function() {
        sinon.spy(confManager, "loadData");
        sinon.spy(formManager, "register");
        sinon.spy(webServices, "registerAPI");
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        expect(iotManager.webServices).to.be.equal(webServices);
        expect(iotManager.appConfiguration).to.be.equal(appConfiguration);
        expect(iotManager.installationManager).to.be.equal(installationManager);
        expect(iotManager.formManager).to.be.equal(formManager);
        expect(iotManager.confManager).to.be.equal(confManager);
        expect(Object.keys(iotManager.iotApps).length).to.be.equal(0);
        expect(Object.keys(iotManager.iotLibs).length).to.be.equal(0);
        expect(confManager.loadData.calledOnce).to.be.true;
        expect(iotManager.iots.length).to.be.equal(0);
        expect(formManager.register.calledTwice).to.be.true;
        expect(webServices.registerAPI.callCount).to.be.equal(5);

        confManager.loadData.restore();
        formManager.register.restore();
        webServices.registerAPI.restore();
    });

    it("registerIotsListForm should register the form", function() {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        sinon.spy(formManager, "register");
        iotManager.registerIotsListForm();
        expect(formManager.register.calledOnce).to.be.true;
        formManager.register.restore();
    });

    it("registerLib should register correctly library", function() {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        
    });

    after(() => {

    });
});
