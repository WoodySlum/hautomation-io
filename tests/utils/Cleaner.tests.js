/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

const Cleaner = require("./../../src/utils/Cleaner");

describe("Cleaner", function() {

    before(() => {

    });

    it("should remove class property for exportConstants", function() {
        const input = {class:"foo", bar:"bar"};
        const output = Cleaner.class.exportConstants(input);
        expect(output.class).to.be.undefined;
        expect(output.bar).to.be.equal("bar");
    });

    after(() => {

    });
});
