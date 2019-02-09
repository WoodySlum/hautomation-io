/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var GlobalMocks = require("./../../GlobalMocks");

const TimeEventService = require("./../../../src/services/timeeventservice/TimeEventService");

describe("TimeEventService", function() {
    const timeEventService = new TimeEventService.class();

    before(() => {

    });

    it("register should create a valid object", function() {
        function foobar(self) {

        }
        sinon.spy(timeEventService, "convertMode");
        sinon.spy(timeEventService, "elementForHash");
        timeEventService.register(foobar, null, TimeEventService.EVERY_SECONDS);
        expect(timeEventService.convertMode.calledOnce).to.be.true;
        expect(timeEventService.elementForHash.calledOnce).to.be.true;
        expect(timeEventService.registeredElements.length).to.be.equal(1);

        timeEventService.convertMode.restore();
        timeEventService.elementForHash.restore();
    });

    it("should convert correctly constant EVERY_SECONDS", function() {
        const input = {mode : TimeEventService.EVERY_SECONDS};
        const output = timeEventService.convertMode(input);
        expect(output.second).to.be.equal("*");
        expect(output.minute).to.be.equal("*");
        expect(output.hour).to.be.equal("*");
    });

    it("should convert correctly constant EVERY_MINUTES", function() {
        const input = {mode : TimeEventService.EVERY_MINUTES};
        const output = timeEventService.convertMode(input);
        expect(output.second).to.be.above(-1);
        expect(output.second).to.be.below(60);
        expect(output.minute).to.be.equal("*");
        expect(output.hour).to.be.equal("*");
    });

    it("should convert correctly constant EVERY_HOURS", function() {
        const input = {mode : TimeEventService.EVERY_HOURS};
        const output = timeEventService.convertMode(input);
        expect(output.second).is.above(-1);
        expect(output.second).is.below(61);
        expect(output.minute).to.be.equal(0);
        expect(output.hour).to.be.equal("*");
    });

    it("should convert correctly constant EVERY_DAYS", function() {
        const input = {mode : TimeEventService.EVERY_DAYS};
        const output = timeEventService.convertMode(input);
        expect(output.second).to.be.equal(0);
        expect(output.minute).is.above(0);
        expect(output.minute).is.below(61);
        expect(output.hour).is.above(-1);
        expect(output.hour).is.below(5);
    });

    it("should convert correctly constant CUSTOM", function() {
        const input = {mode : TimeEventService.CUSTOM, second:"*", minute:14, hour:12};
        const output = timeEventService.convertMode(input);
        expect(output.second).to.be.equal("*");
        expect(output.minute).to.be.equal(14);
        expect(output.hour).to.be.equal(12);
    });

    after(() => {

    });
});
