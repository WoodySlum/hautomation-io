/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var GlobalMocks = require("./../../GlobalMocks");

var ServicesManager = require("./../../../src/modules/servicesmanager/ServicesManager");
var Service = require("./../../../src/services/Service");

describe("ServicesManager", function() {
    const serviceFoo = new Service.class("foo");
    const serviceBar = new Service.class("bar");
    const servicesManager = new ServicesManager.class();
    servicesManager.add(serviceFoo);
    servicesManager.add(serviceBar);

    before(() => {

    });

    it("should found service", () => {
        expect(servicesManager.isServiceRegistered(serviceBar)).to.be.equal(1);
    });

    it("should not found unexisting service", () => {
        expect(servicesManager.isServiceRegistered(new Service.class("foobar"))).to.be.equal(-1);
    });

    it("add should correctly add new service", () => {
        const fooBar = new Service.class("foobar");
        expect(servicesManager.isServiceRegistered(new Service.class("foobar"))).to.be.equal(-1);
        servicesManager.add(fooBar);
        expect(servicesManager.isServiceRegistered(new Service.class("foobar"))).to.be.equal(2);
    });

    it("add should correctly remove service", () => {
        const fooBar = new Service.class("foobar");
        expect(servicesManager.isServiceRegistered(new Service.class("foobar"))).to.be.equal(2);
        servicesManager.remove(fooBar);
        expect(servicesManager.isServiceRegistered(new Service.class("foobar"))).to.be.equal(-1);
    });

    it("add should call start on each services", () => {
        sinon.spy(serviceFoo, "start");
        sinon.spy(serviceBar, "start");
        servicesManager.start();
        expect(serviceFoo.start.calledOnce).to.be.true;
        expect(serviceBar.start.calledOnce).to.be.true;

        serviceFoo.start.restore();
        serviceBar.start.restore();
    });

    it("add should call stop on each services", () => {
        sinon.spy(serviceFoo, "stop");
        sinon.spy(serviceBar, "stop");
        servicesManager.stop();
        expect(serviceFoo.stop.calledOnce).to.be.true;
        expect(serviceBar.stop.calledOnce).to.be.true;

        serviceFoo.stop.restore();
        serviceBar.stop.restore();
    });

    it("restart should call restart on each services", () => {
        sinon.spy(serviceFoo, "restart");
        sinon.spy(serviceBar, "restart");
        servicesManager.restart();
        expect(serviceFoo.restart.calledOnce).to.be.true;
        expect(serviceBar.restart.calledOnce).to.be.true;

        serviceFoo.restart.restore();
        serviceBar.restart.restore();
    });

    it("getService should return a correct service", () => {
        expect(servicesManager.getService("foo")).to.be.equal(serviceFoo);
    });

    it("getService should return null", () => {
        expect(servicesManager.getService("foobar")).to.be.null;
    });

    after(() => {

    });
});
