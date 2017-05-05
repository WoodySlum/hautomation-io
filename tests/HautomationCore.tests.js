/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

var HautomationCore = require("./../HautomationCore");
var WebServices = require("./../services/webservices/WebServices");

describe("HautomationCore", function() {
    const ws = new WebServices();

    before(() => {
        sinon.stub(ws, "start");
    });

    it("constructor should fill at least 1 service item", function() {
        let c = new HautomationCore(ws);
        expect(c.services.length).to.be.above(0);
    });

    it("should call start", function() {
        let c = new HautomationCore(ws);
        c.start();

        expect(ws.start.calledOnce).to.be.true;
    });

    after(function () {
        ws.start.restore();
    });
});
