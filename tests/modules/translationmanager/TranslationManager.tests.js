/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var GlobalMocks = require("./../../GlobalMocks");

var TranslateManager = require("./../../../src/modules/translatemanager/TranslateManager");

describe("Translatemanager", function() {
    let translateManager = new TranslateManager.class("en");

    before(() => {
        translateManager.translations = {
            "foo":"bar",
            "hello":"My name is %@ and firstname %@",
            "foobar":"FooBar"
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

    it("should translate an array of items", function() {
        const tArray = translateManager.translateArray(["foo", "foobar"]);
        expect(tArray.length).to.be.equal(2);
        expect(tArray[0]).to.be.equal("bar");
        expect(tArray[1]).to.be.equal("FooBar");
    });

    after(function () {

    });
});
