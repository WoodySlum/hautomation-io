/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

const HautomationCore = require("./../../../src/HautomationCore");
const InstallationManager = require("./../../../src/modules/installationmanager/InstallationManager");
const core = new HautomationCore.class();

describe("InstallationManager", function() {
    before(() => {

    });

    it("constructor should call several methods for intialization", function() {
        sinon.spy(core.confManager, "loadData");
        const installationManager = new InstallationManager.class(core.confManager, core.eventBus);

        expect(core.confManager.loadData.calledOnce).to.be.true;
        expect(installationManager).to.have.property("confManager");
        expect(installationManager).to.have.property("commandList");
        expect(installationManager).to.have.property("eventBus");
        expect(installationManager).to.have.property("commandDone");

        core.confManager.loadData.restore();
    });

    it("shoud register commands well", function() {
        const installationManager = new InstallationManager.class(core.confManager, core.eventBus);
        installationManager.register("0.1.0", "*", "echo \"foo\" > /tmp/foobar");
        installationManager.register("0.1.1", "*", "echo \"bar\" > /tmp/barfoo");
        expect(installationManager.commandList.length).to.be.equal(2);
    });

    it("isAlreadyExecuted should return good information", function() {
        const installationManager = new InstallationManager.class(core.confManager, core.eventBus);
        installationManager.commandDone["54d0907782c21f9f624ea5eb97aa9866cc7824b6dae286d491d3555c306062b3"] = 1;
        expect(installationManager.isAlreadyExecuted("54d0907782c21f9f624ea5eb97aa9866cc7824b6dae286d491d3555c306062b3")).to.be.true;
        expect(installationManager.isAlreadyExecuted("bc9162f881f2210653185fff7f25a88b2dca381df04a305ecf4709354c5fbe41")).to.be.false;
    });

    it("isValidForArchitecture should return good information", function() {
        const installationManager = new InstallationManager.class(core.confManager, core.eventBus);
        expect(installationManager.isValidForArchitecture("*", "arm")).to.be.true;
        expect(installationManager.isValidForArchitecture(["x86", "arm"], "arm")).to.be.true;
        expect(installationManager.isValidForArchitecture(["x86"], "arm")).to.be.false;
        expect(installationManager.isValidForArchitecture(["X86"], "x86")).to.be.true;
        expect(installationManager.isValidForArchitecture(["x64"], "X64")).to.be.true;
    });

    after(() => {

    });
});
