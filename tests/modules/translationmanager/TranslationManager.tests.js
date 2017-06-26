/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

var TranslateManager = require("./../../../src/modules/translatemanager/TranslateManager");

describe("Translatemanager", function() {
    let translateManager = new TranslateManager.class("en");

    before(() => {
        translateManager.translations = {
            "foo":"bar",
            "hello":"My name is %@ and firstname %@"
        }
    });

    it("should return a standard translation", function() {
        expect(translateManager.t("foo")).to.be.equal("bar");
    });

    it("should return a translation with replacements", function() {
        expect(translateManager.t("hello", "woody", "slum")).to.be.equal("My name is woody and firstname slum");
    });

    it("should return key when not found", function() {
        expect(translateManager.t("abc", "woody", "slum")).to.be.equal("abc");
    });

    after(function () {

    });
});
