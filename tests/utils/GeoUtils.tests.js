/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

const GeoUtils = require("./../../src/utils/GeoUtils");

describe("GeoUtils", function() {

    before(() => {

    });

    it("getDistance should return the correct distance", function() {
        expect(GeoUtils.class.getDistance(4.864720, 45.765243, 4.795793, 45.753465)).to.be.equal(5505);
    });

    it("isInZone should return true", function() {
        expect(GeoUtils.class.isInZone(4.864720, 45.765243, 6000, 4.795793, 45.753465)).to.be.true;
    });

    it("isInZone should return false", function() {
        expect(GeoUtils.class.isInZone(4.864720, 45.765243, 5000, 4.795793, 45.753465)).to.be.false;
    });

    after(() => {

    });
});
