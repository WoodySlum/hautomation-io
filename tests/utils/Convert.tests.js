/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var GlobalMocks = require("./../GlobalMocks");

const Convert = require("./../../src/utils/Convert");

describe("Convert", function() {

    before(() => {

    });

    it("convert properties should convert a key/value array into a single object", function() {
        const input = [{key:"foo", value:"bar"}, {key:"bar", value:"foo"}];
        const output = Convert.class.convertProperties(input);
        expect(output.foo).to.be.equal("bar");
        expect(output.bar).to.be.equal("foo");
    });

    after(() => {

    });
});
