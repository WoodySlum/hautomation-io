/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var GlobalMocks = require("./../../GlobalMocks");

const HautomationCore = require("./../../../src/HautomationCore").class;
const GatewayManager = require("./../../../src/modules/gatewaymanager/GatewayManager");
const TimeEventService = require("./../../../src/services/timeeventservice/TimeEventService");
const HautomationRunnerConstants = require("./../../../HautomationRunnerConstants");

const core = new HautomationCore();
describe("GatewayManager", function() {
    before(() => {

    });

    it("constructor should init correctly stuff", function() {
        const tesSpy = sinon.spy(core.timeEventService, "register");
        const eventSpy = sinon.spy(core.eventBus, "on");
        sinon.spy(GatewayManager.class.prototype, "transmit");
        const gatewayManager = new GatewayManager.class(core.environmentManager, "1.0", "aaaaaa", core.timeEventService, {}, core.webServices, core.eventBus, core.scenarioManager, "FOOBAR");
        expect(tesSpy.withArgs(sinon.match.any, gatewayManager, TimeEventService.EVERY_DAYS).calledOnce).to.be.true;
        expect(eventSpy.withArgs("FOOBAR", sinon.match.any).calledOnce).to.be.true;
        expect(eventSpy.withArgs(HautomationRunnerConstants.RESTART, sinon.match.any).calledOnce).to.be.true;
        expect(GatewayManager.class.prototype.transmit.calledOnce).to.be.true;

        core.timeEventService.register.restore();
        core.eventBus.on.restore();
        GatewayManager.class.prototype.transmit.restore();
    });

    after(() => {

    });
});
