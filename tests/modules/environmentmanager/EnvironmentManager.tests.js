/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var GlobalMocks = require("./../../GlobalMocks");

const HautomationCore = require("./../../../src/HautomationCore").class;
const EnvironmentManager = require("./../../../src/modules/environmentmanager/EnvironmentManager");

const core = new HautomationCore();
describe("EnvironmentManager", function() {
    before(() => {

    });

    it("constructor should init correctly stuff", function() {
        sinon.spy(core.confManager, "readFile");
        sinon.spy(core.formManager, "register");
        sinon.spy(core.dashboardManager, "registerTile");
        const environmentManager = new EnvironmentManager.class({home:{foo:"bar"}}, core.confManager, core.formManager, core.webServices, core.dashboardManager, core.translateManager, core.scenarioManager, 0, 0, core.installationManager, core.timeEventService);
        expect(core.confManager.readFile.calledOnce).to.be.true;
        expect(core.formManager.register.calledThrice).to.be.true;
        expect(core.dashboardManager.registerTile.calledOnce).to.be.true;
        expect(environmentManager.formConfiguration.data).to.be.not.null;
        expect(Object.keys(environmentManager.formConfiguration.data).length).to.be.equal(0);

        core.confManager.readFile.restore();
        core.formManager.register.restore();
        core.dashboardManager.registerTile.restore();
    });

    it("getCoordinates should return the coordinates", function() {
        const environmentManager = new EnvironmentManager.class({home:{foo:"bar"}}, core.confManager, core.formManager, core.webServices, core.dashboardManager, core.translateManager, core.scenarioManager, 0, 0, core.installationManager, core.timeEventService);
        expect(environmentManager.getCoordinates().foo).to.be.equal("bar");
    });

    it("setDay should well set day", function() {
        const environmentManager = new EnvironmentManager.class({home:{foo:"bar"}}, core.confManager, core.formManager, core.webServices, core.dashboardManager, core.translateManager, core.scenarioManager, 0, 0, core.installationManager, core.timeEventService);
        environmentManager.formConfiguration.data.day = false;
        sinon.spy(environmentManager, "registerTile");
        environmentManager.setDay();
        expect(environmentManager.isNight()).to.be.false;
        expect(environmentManager.registerTile.calledOnce).to.be.true;
        environmentManager.registerTile.restore();
    });

    it("setNight should well set night", function() {
        const environmentManager = new EnvironmentManager.class({home:{foo:"bar"}}, core.confManager, core.formManager, core.webServices, core.dashboardManager, core.translateManager, core.scenarioManager, 0, 0, core.installationManager, core.timeEventService);
        environmentManager.formConfiguration.data.day = true;
        sinon.spy(environmentManager, "registerTile");
        environmentManager.setNight();
        expect(environmentManager.isNight()).to.be.true;
        expect(environmentManager.registerTile.calledOnce).to.be.true;
        environmentManager.registerTile.restore();
    });

    it("registerTile should call dashboard manager", function() {
        const environmentManager = new EnvironmentManager.class({home:{foo:"bar"}}, core.confManager, core.formManager, core.webServices, core.dashboardManager, core.translateManager, core.scenarioManager, 0, 0, core.installationManager, core.timeEventService);
        sinon.spy(core.dashboardManager, "registerTile");
        environmentManager.registerTile();
        expect(core.dashboardManager.registerTile.calledOnce).to.be.true;
        core.dashboardManager.registerTile.restore();
    });

    after(() => {

    });
});
