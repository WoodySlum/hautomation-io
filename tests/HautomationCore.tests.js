/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

var HautomationCore = require("./../src/HautomationCore").class;
var WebServices = require("./../src/services/webservices/WebServices");

describe("HautomationCore", function() {
    const ws = new WebServices.class();

    before(() => {
        sinon.stub(ws, "start");
    });

    it("constructor should fill at least 1 service item", function() {
        let c = new HautomationCore();
        expect(c.servicesManager.services.length).to.be.above(0);
    });

    it("should call start", function() {
        let c = new HautomationCore();
        c.servicesManager.services = [ws];
        c.start();

        expect(ws.start.calledOnce).to.be.true;
    });

    after(function () {
        ws.start.restore();
    });
});
