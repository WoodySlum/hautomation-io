var chai = require('chai');
var expect = chai.expect;

var HautomationCore = require('./../HautomationCore');

describe('HautomationCore', function() {
    it('sample() should return same data as entry', function() {
        let a = new HautomationCore();

        expect(a.sample(1)).to.equal(1);
    });
});