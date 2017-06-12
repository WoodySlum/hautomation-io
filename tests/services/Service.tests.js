/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

const ThreadsManager = require("./../../src/modules/threadsmanager/ThreadsManager")
const Service = require("./../../src/services/Service");

describe("Service", function() {

    before(() => {

    });

    it("normal mode should call start", () => {
        const service = new Service.class("foo", null, Service.SERVICE_MODE_CLASSIC)
        sinon.spy(service, "start");
        sinon.spy(service, "startThreaded");
        sinon.spy(service, "startExternal");

        service.start();

        expect(service.start.calledOnce);
        expect(service.startThreaded.called).to.be.false;
        expect(service.startExternal.called).to.be.false;
        expect(service.status).to.be.equal(Service.RUNNING);

        service.start.restore();
        service.startThreaded.restore();
        service.startExternal.restore();
    });

    it("normal mode should call stop", () => {
        const service = new Service.class("foo", null, Service.SERVICE_MODE_CLASSIC)
        sinon.spy(service, "stop");
        sinon.spy(service, "stopThreaded");
        sinon.spy(service, "stopExternal");

        service.start();
        service.stop();

        expect(service.stop.calledOnce);
        expect(service.stopThreaded.called).to.be.false;
        expect(service.stopExternal.called).to.be.false;
        expect(service.status).to.be.equal(Service.STOPPED);

        service.stop.restore();
        service.stopThreaded.restore();
        service.stopExternal.restore();
    });

    it("restart should call stop and start", () => {
        const service = new Service.class("foo", null, Service.SERVICE_MODE_CLASSIC)
        service.start();

        sinon.spy(service, "stop");
        sinon.spy(service, "start");

        service.restart();

        expect(service.stop.calledOnce).to.be.true;
        expect(service.start.calledOnce).to.be.true;

        service.stop.restore();
        service.start.restore();
    });

    it("start threaded shoud be well processed", () => {
        const threadsManager = new ThreadsManager.class();
        const runStub = sinon.stub(threadsManager, "run").callsFake(() => {});

        const service = new Service.class("foo", threadsManager, Service.SERVICE_MODE_THREADED);

        sinon.spy(service, "startThreaded");
        sinon.spy(threadsManager, "getPid");

        service.start();

        expect(service.startThreaded.calledOnce).to.be.true;
        expect(runStub.withArgs(service.run, "foo", sinon.match.any, service.threadCallback).calledOnce).to.be.true;
        expect(threadsManager.getPid.withArgs("foo").calledOnce).to.be.true;

        service.startThreaded.restore();
        threadsManager.run.restore();
        threadsManager.getPid.restore();
    });

    it("start threaded shoud throw exception", () => {
        const service = new Service.class("foo", null, Service.SERVICE_MODE_THREADED);

        try {
            service.startThreaded();
            expect(true).to.be.false;
        } catch(e) {
            expect(e.message).to.equal(Service.ERROR_UNDEFINED_THREADS_MANAGER);
        }
    });

    it("stop threaded shoud be well processed", () => {
        const threadsManager = new ThreadsManager.class();
        const runStub = sinon.stub(threadsManager, "run").callsFake(() => {});
        const runPid = sinon.stub(threadsManager, "getPid").callsFake(() => {});
        const killStub = sinon.stub(threadsManager, "kill").callsFake(() => {});

        const service = new Service.class("foo", threadsManager, Service.SERVICE_MODE_THREADED);

        sinon.spy(service, "stopThreaded");

        service.start();
        service.stop();

        expect(service.stopThreaded.calledOnce).to.be.true;
        expect(threadsManager.kill.withArgs("foo").calledOnce).to.be.true;

        service.stopThreaded.restore();
        threadsManager.run.restore();
        threadsManager.getPid.restore();
        threadsManager.kill.restore();
    });

    it("start external shoud be well processed", () => {

        const service = new Service.class("foo", null, Service.SERVICE_MODE_EXTERNAL, "ls -al");

        sinon.spy(service, "startExternal");

        service.start();

        expect(service.startExternal.calledOnce).to.be.true;
        expect(service.pid != null).to.be.true;
        expect(service.childProcess != null).to.be.true;

        service.startExternal.restore();
    });

    it("start external shoud throw exception when empty command is provided", () => {
        const service = new Service.class("foo", null, Service.SERVICE_MODE_EXTERNAL);

        try {
            service.startExternal();
            expect(true).to.be.false;
        } catch(e) {
            expect(e.message).to.equal(Service.ERROR_EXTERNAL_COMMAND_UNDEF);
        }
    });

    it("stop external shoud be well processed", () => {

        const service = new Service.class("foo", null, Service.SERVICE_MODE_EXTERNAL, "ls -al");

        sinon.spy(service, "stopExternal");

        service.start();
        service.stop();

        expect(service.stopExternal.calledOnce).to.be.true;
        expect(service.pid === null).to.be.true;
        expect(service.childProcess === null).to.be.true;

        service.stopExternal.restore();
    });

    after(() => {

    });
});
