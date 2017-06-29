/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

var ConfManager = require("./../../../src/modules/confmanager/ConfManager");
var TranslateManager = require("./../../../src/modules/translatemanager/TranslateManager");
var FormManager = require("./../../../src/modules/formmanager/FormManager");
var FormConfiguration = require("./../../../src/modules/formconfiguration/FormConfiguration");
var WebServices = require("./../../../src/services/webservices/WebServices");
var FormObject = require("./../../../src/modules/formmanager/FormObject").class;

class BarFoo extends FormObject {
    constructor(id, xo) {
        super(id);
        /**
         * @Property("xo");
         * @Type("string");
         * @Title("Another extended form");
         */
        this.xo = xo;
    }

    json(data) {
        return new BarFoo(data.id, data.xo);
    }
}

describe("FormConfiguration", function() {
    const confManager = new ConfManager.class({configurationPath:"/foo/bar"});
    const translateManager = new TranslateManager.class("en");
    translateManager.translations = {"const.test":"Translated value","Foo":"BARFOO","WOODY":"DUBOIS"};
    const formManager = new FormManager.class(translateManager);
    const webServices = new WebServices.class(9090, 9091);
    //constructor(confManager, formManager, webServices, name, list = false, formClass = null) {
    //const formConfig = new FormConfiguration.class(confManager, formManager, webServices, "foobar");

    before(() => {

    });

    it("should call constructor with good settings (not list mode)", function() {
        sinon.spy(webServices, "registerAPI");
        const fc = new FormConfiguration.class(confManager, formManager, webServices, "Foobar");
        expect(webServices.registerAPI.calledThrice).to.be.true;
        expect(fc).to.have.property("data");
        expect(fc).to.have.property("confManager");
        expect(fc).to.have.property("webServices");
        expect(fc).to.have.property("formManager");
        expect(fc).to.have.property("name");
        expect(fc).to.have.property("list");
        expect(fc).to.have.property("formClass");

        expect(fc.list).to.be.equal(false);
        expect(fc.data).to.be.null;
        expect(fc.name).to.be.equal("foobar");
        expect(fc.confKey).to.be.equal("foobar.conf");

        webServices.registerAPI.restore();
    });

    it("should load configuration file on register", function() {
        sinon.spy(confManager, "loadData");
        sinon.spy(formManager, "register");
        const fc = new FormConfiguration.class(confManager, formManager, webServices, "Foobar");
        fc.registerForm(BarFoo);

        expect(confManager.loadData.calledOnce).to.be.true;
        expect(formManager.register.calledOnce).to.be.true;
        expect(fc.formClass).to.be.equal(BarFoo);

        confManager.loadData.restore();
        formManager.register.restore();
    });

    it("should save configuration (normal mode)", function() {
        sinon.spy(confManager, "setData");

        const fc = new FormConfiguration.class(confManager, formManager, webServices, "Foobar", false, BarFoo);
        fc.saveConfig({xo:"foo"});

        expect(confManager.setData.calledOnce).to.be.true;
        expect(fc.getConfig().id).to.be.not.null;
        expect(fc.getConfig().xo).to.be.equal("foo");

        confManager.setData.restore();
    });

    it("should call constructor with good settings (list mode)", function() {
        sinon.spy(webServices, "registerAPI");
        sinon.spy(confManager, "loadData");
        sinon.spy(formManager, "register");
        const fc = new FormConfiguration.class(confManager, formManager, webServices, "Foobar", true, BarFoo);

        expect(webServices.registerAPI.calledThrice).to.be.true;
        expect(confManager.loadData.calledOnce).to.be.true;
        expect(formManager.register.calledOnce).to.be.true;
        expect(fc.list).to.be.equal(true);
        expect(fc.data.length).to.be.equal(0);
        expect(fc.formClass).to.be.equal(BarFoo);

        webServices.registerAPI.restore();
        confManager.loadData.restore();
        formManager.register.restore();
    });

    it("should save configuration (list mode)", function() {
        sinon.spy(confManager, "setData");
        
        const fc = new FormConfiguration.class(confManager, formManager, webServices, "Foobar", true, BarFoo);
        fc.saveConfig({xo:"foo"});

        let config = fc.getConfig();
        expect(confManager.setData.calledOnce).to.be.true;
        expect(config.length).to.be.equal(1);
        expect(config[0].id).to.be.not.null;
        expect(config[0].xo).to.be.equal("foo");

        // Update item
        config[0].xo = "bar";
        fc.saveConfig(config[0]);
        config = fc.getConfig();
        expect(config.length).to.be.equal(1);
        expect(config[0].xo).to.be.equal("bar");

        // Save item
        fc.saveConfig({xo:"foobar"});
        config = fc.getConfig();

        expect(config.length).to.be.equal(2);
        expect(config[0].xo).to.be.equal("bar");
        expect(config[1].xo).to.be.equal("foobar");

        confManager.setData.restore();
    });


    after(() => {

    });
});
