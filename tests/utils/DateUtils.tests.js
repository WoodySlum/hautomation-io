/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

const DateUtils = require("./../../src/utils/DateUtils");

describe("DateUtils", function() {

    before(() => {

    });

    it("roundedTimestamp should round correctly timestamp", function() {
        expect(DateUtils.class.roundedTimestamp(1467623167, DateUtils.ROUND_TIMESTAMP_MINUTE)).to.be.equal(1467623160);
        expect(DateUtils.class.roundedTimestamp(1467623167, DateUtils.ROUND_TIMESTAMP_HOUR)).to.be.equal(1467622800);
        expect(DateUtils.class.roundedTimestamp(1467623167, DateUtils.ROUND_TIMESTAMP_DAY)).to.be.equal(1467590400);
        expect(DateUtils.class.roundedTimestamp(1467623167, DateUtils.ROUND_TIMESTAMP_MONTH)).to.be.equal(1467331200);
        expect(DateUtils.class.roundedTimestamp(1478003040, DateUtils.ROUND_TIMESTAMP_MONTH)).to.be.equal(1477958400);
    });

    after(() => {

    });
});
