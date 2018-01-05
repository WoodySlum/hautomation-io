/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var moment = require("moment-timezone");
var GlobalMocks = require("./../GlobalMocks");

const DateUtils = require("./../../src/utils/DateUtils");

describe("DateUtils", function() {

    before(() => {
        moment.tz.setDefault("Europe/London");
    });

    it("roundedTimestamp should round correctly timestamp", function() {
        expect(DateUtils.class.roundedTimestamp(1467623167, DateUtils.ROUND_TIMESTAMP_MINUTE)).to.be.equal(1467623160);
        expect(DateUtils.class.roundedTimestamp(1467623167, DateUtils.ROUND_TIMESTAMP_HOUR)).to.be.equal(1467622800);
        expect(DateUtils.class.roundedTimestamp(1467623167, DateUtils.ROUND_TIMESTAMP_DAY)).to.be.equal(1467590400);
        expect(DateUtils.class.roundedTimestamp(1467623167, DateUtils.ROUND_TIMESTAMP_MONTH)).to.be.equal(1467331200);
        expect(DateUtils.class.roundedTimestamp(1478003040, DateUtils.ROUND_TIMESTAMP_MONTH)).to.be.equal(1477958400);
    });

    it("dateToUTCTimestamp should convert date to UTC timestamp", function() {
        expect(DateUtils.class.dateToUTCTimestamp("2017-08-11 13:31:18")).to.be.equal(1502451078);
    });

    it("dateToTimestamp should convert date to timestamp", function() {
        expect(DateUtils.class.dateToTimestamp("2017-08-11 13:31:18")).to.be.equal(1502458278);
    });

    // secondsElapsedSinceMidnight(timestamp)
    it("secondsElapsedSinceMidnight should return good number of seconds", function() {
        expect(DateUtils.class.secondsElapsedSinceMidnight(1507022887)).to.be.equal(34108);
    });

    after(() => {

    });
});
