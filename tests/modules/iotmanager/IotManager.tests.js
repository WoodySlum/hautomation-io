/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var GlobalMocks = require("./../../GlobalMocks");

const IotManager = require("./../../../src/modules/iotmanager/IotManager");
const FormObject = require("./../../../src/modules/formmanager/FormObject");
const HautomationCore = require("./../../../src/HautomationCore").class;
const DateUtils = require("./../../../src/utils/DateUtils");
const core = new HautomationCore();



const appConfiguration = {cachePath:"/foobar/"};
const webServices = core.webServices;
const installationManager = core.installationManager;
const formManager = core.formManager;
const environmentManager = core.environmentManager;
const confManager = core.confManager;

class IotLibForm extends FormObject.class {
    constructor(id = null, myLibProperty = null) {
        super(id);

        /**
         * @Property("myLibProperty");
         * @Type("string");
         */
        this.myLibProperty = myLibProperty;
    }

    json(data) {
        return new IotLibForm(data.id, data.myLibProperty);
    }
}

class IotAppForm extends FormObject.class {
    constructor(id = null, myAppProperty = null) {
        super(id);

        /**
         * @Property("myAppProperty");
         * @Type("string");
         */
        this.myAppProperty = myAppProperty;
    }

    json(data) {
        return new IotLibForm(data.id, data.myAppProperty);
    }
}

describe("IotManager", function() {
    before(() => {

    });

    it("constructor should initialize stuff correctly", function() {
        sinon.spy(confManager, "loadData");
        sinon.spy(formManager, "register");
        sinon.spy(webServices, "registerAPI");
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        expect(iotManager.webServices).to.be.equal(webServices);
        expect(iotManager.appConfiguration).to.be.equal(appConfiguration);
        expect(iotManager.installationManager).to.be.equal(installationManager);
        expect(iotManager.formManager).to.be.equal(formManager);
        expect(iotManager.confManager).to.be.equal(confManager);
        expect(Object.keys(iotManager.iotApps).length).to.be.equal(0);
        expect(Object.keys(iotManager.iotLibs).length).to.be.equal(0);
        expect(confManager.loadData.calledOnce).to.be.true;
        expect(iotManager.iots.length).to.be.equal(0);
        expect(formManager.register.calledTwice).to.be.true;
        expect(webServices.registerAPI.callCount).to.be.equal(6);

        confManager.loadData.restore();
        formManager.register.restore();
        webServices.registerAPI.restore();
    });

    it("registerIotsListForm should register the form", function() {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        sinon.spy(formManager, "register");
        iotManager.registerIotsListForm();
        expect(formManager.register.calledOnce).to.be.true;
        formManager.register.restore();
    });

    it("registerLib should throw an exception due to empty folder", function() {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);

        try {
            iotManager.registerLib("/tmp/foobar", "foolib", 2);
            expect(false).to.be.true;
        } catch(e) {
            expect(e.message).to.be.not.null;
        }
    });

    it("registerLib should well register lib", function() {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        const fs = require("fs-extra");
        sinon.stub(fs, "existsSync").callsFake((path) => {
            return true;
        });
        sinon.spy(formManager, "register");

        iotManager.registerLib("/tmp/foobar", "foolib", 2, {}, IotLibForm);
        expect(iotManager.iotLibs["foolib"]).to.be.not.null;
        expect(iotManager.iotLibs["foolib"].lib).to.be.equal("/tmp/foobar/lib");
        expect(iotManager.iotLibs["foolib"].globalLib).to.be.equal("/tmp/foobar/global_lib");
        expect(iotManager.iotLibs["foolib"].form).to.be.equal(IotLibForm);
        expect(iotManager.iotLibs["foolib"].version).to.be.equal(2);
        expect(formManager.register.calledOnce).to.be.true;

        fs.existsSync.restore();
        formManager.register.restore();
    });

    it("registerApp should throw an exception due to empty folder", function() {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);

        try {
            iotManager.registerApp("/tmp/foobar", "fooapp", "Foo Bar", 5, "fooPlatform", "barBoard", "foobarFramework", [], null, {}, IotAppForm);
            expect(false).to.be.true;
        } catch(e) {
            expect(e.message).to.be.not.null;
        }
    });

    it("registerApp should failed due to missing dependency", function() {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        const fs = require("fs-extra");
        sinon.stub(fs, "existsSync").callsFake((path) => {
            return true;
        });
        sinon.spy(formManager, "register");

        try {
            iotManager.registerLib("/tmp/foobar", "foolib", 2, IotLibForm);
            iotManager.registerApp("/tmp/foobar", "fooapp", "Foo Bar", 5, "fooPlatform", "barBoard", "foobarFramework", ["foolib"], null, {}, IotAppForm);
            expect(false).to.be.true;
        } catch(e) {
            expect(e.message).to.be.not.null;
        }

        fs.existsSync.restore();
        formManager.register.restore();
    });

    it("registerApp should well register app", function() {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        const fs = require("fs-extra");
        sinon.stub(fs, "existsSync").callsFake((path) => {
            return true;
        });
        sinon.spy(formManager, "register");
        sinon.spy(formManager, "addAdditionalFields");

        iotManager.registerLib("/tmp/foobar", "foolib", 2, {left:{"3V3":["foobar"]}}, IotLibForm);
        iotManager.registerApp("/tmp/foobar", "fooapp", "Foo Bar", 5, "fooPlatform", "barBoard", "foobarFramework", ["foolib"], {foo:"bar"}, {right:{"GND":["barfoo"]}}, IotAppForm);
        expect(iotManager.iotApps["fooapp"]).to.be.not.null;
        expect(iotManager.iotApps["fooapp"].src).to.be.equal("/tmp/foobar/src");
        expect(iotManager.iotApps["fooapp"].lib).to.be.equal("/tmp/foobar/lib");
        expect(iotManager.iotApps["fooapp"].globalLib).to.be.equal("/tmp/foobar/global_lib");
        expect(iotManager.iotApps["fooapp"].name).to.be.equal("Foo Bar");
        expect(iotManager.iotApps["fooapp"].version).to.be.equal(5);
        expect(iotManager.iotApps["fooapp"].platform).to.be.equal("fooPlatform");
        expect(iotManager.iotApps["fooapp"].board).to.be.equal("barBoard");
        expect(iotManager.iotApps["fooapp"].framework).to.be.equal("foobarFramework");
        expect(iotManager.iotApps["fooapp"].dependencies.length).to.be.equal(1);
        expect(iotManager.iotApps["fooapp"].dependencies[0]).to.be.equal("foolib");
        expect(iotManager.iotApps["fooapp"].options.foo).to.be.equal("bar");
        expect(formManager.register.calledTwice).to.be.true;
        expect(formManager.addAdditionalFields.calledOnce).to.be.true;
        expect(iotManager.iotLibs["foolib"].wiringSchema.left["3V3"][0]).to.be.equal("foobar");
        expect(iotManager.iotApps["fooapp"].wiringSchema.right["GND"][0]).to.be.equal("barfoo");

        fs.existsSync.restore();
        formManager.register.restore();
        formManager.addAdditionalFields.restore();
    });

    it("build app should execute all steps", function(done) {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        const fs = require("fs-extra");
        sinon.stub(fs, "existsSync").callsFake((path) => {
            return true;
        });
        sinon.stub(fs, "ensureDirSync").callsFake((dir) => {});
        sinon.stub(fs, "copySync").callsFake((src, dest) => {});
        sinon.stub(fs, "readFileSync").callsFake((file) => {
            return "foo = \"%config%\";"
        });
        sinon.stub(DateUtils.class, "timestamp").callsFake(() => {return 1234;});
        sinon.stub(fs, "writeFileSync").callsFake((file, content) => {
            eval(content);
            const parsed = JSON.parse(foo);
            expect(parsed.port).to.be.not.null;
            expect(parsed.ip).to.be.not.null;
            expect(parsed.version).to.be.not.equal(7);
            expect(parsed.options).to.be.not.null;
            expect(parsed.options.foo).to.be.equal("bar");
            expect(parsed.options.foobar).to.be.equal("barfoo");
        });
        sinon.stub(iotManager, "writeDescriptor").callsFake((tmpDir, appId) => {});
        sinon.stub(installationManager, "executeCommand").callsFake((command, wait, cb) => {
            cb(null, command);
        });

        iotManager.registerLib("/tmp/foobar", "foolib", 2, {}, IotLibForm);
        iotManager.registerApp("/tmp/foobar", "fooapp", "Foo Bar", 5, "fooPlatform", "barBoard", "foobarFramework", ["foolib"], {foo:"bar"}, {}, IotAppForm);
        iotManager.build("fooiot", "fooapp", false, {foobar:"barfoo"}, (error, result) => {
            expect(fs.ensureDirSync.calledOnce).to.be.true;
            expect(fs.copySync.callCount).to.be.equal(5);
            expect(fs.readFileSync.calledOnce).to.be.true;
            expect(iotManager.writeDescriptor.calledOnce).to.be.true;
            expect(installationManager.executeCommand.calledOnce).to.be.true;
            expect(fs.writeFileSync.calledOnce).to.be.true;
            expect(Object.keys(result).length).to.be.equal(2);
            expect(result.firmwarePath).to.be.equal("/foobar/iot-flash-1234-fooapp/.pio/build/barBoard/firmware.bin");
            expect(result.stdout).to.be.equal("cd /foobar/iot-flash-1234-fooapp/; platformio update; platformio run -e barBoard");
            done();
        });


        fs.existsSync.restore();
        fs.ensureDirSync.restore();
        fs.copySync.restore();
        fs.readFileSync.restore();
        fs.writeFileSync.restore();
        iotManager.writeDescriptor.restore();
        installationManager.executeCommand.restore();
        DateUtils.class.timestamp.restore();

    });

    it("generate descriptor should be correct", function(done) {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        const fs = require("fs-extra");
        sinon.stub(fs, "existsSync").callsFake((path) => {
            return true;
        });
        sinon.stub(fs, "writeFileSync").callsFake((file, content) => {
            const expected = "[env:barBoard]\n" +
                             "platform = fooPlatform\n" +
                            "board = barBoard\n" +
                            "framework = foobarFramework\n\n" +
                            "[platformio]\n" +
                            "lib_dir = ./global_lib\n" +
                            "lib_extra_dirs = ./lib\n";
            expect(content).to.be.equal(expected);
            done();
        });

        iotManager.registerLib("/tmp/foobar", "foolib", 2, {}, IotLibForm);
        iotManager.registerApp("/tmp/foobar", "fooapp", "Foo Bar", 5, "fooPlatform", "barBoard", "foobarFramework", ["foolib"], {foo:"bar"}, {}, IotAppForm);
        iotManager.writeDescriptor("foolder", "fooapp");

        fs.writeFileSync.restore();
        fs.existsSync.restore();
    });

    it("iotAppExists should return true", function() {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        const fs = require("fs-extra");
        sinon.stub(fs, "existsSync").callsFake((path) => {
            return true;
        });

        iotManager.registerLib("/tmp/foobar", "foolib", 2, {}, IotLibForm);
        iotManager.registerApp("/tmp/foobar", "fooapp", "Foo Bar", 5, "fooPlatform", "barBoard", "foobarFramework", ["foolib"], {foo:"bar"}, {}, IotAppForm);
        expect(iotManager.iotAppExists("fooapp")).to.be.true;

        fs.existsSync.restore();
    });

    it("iotAppExists should return false", function() {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        const fs = require("fs-extra");
        sinon.stub(fs, "existsSync").callsFake((path) => {
            return true;
        });

        iotManager.registerLib("/tmp/foobar", "foolib", 2, {}, IotLibForm);
        iotManager.registerApp("/tmp/foobar", "fooapp", "Foo Bar", 5, "fooPlatform", "barBoard", "foobarFramework", ["foolib"], {foo:"bar"}, {}, IotAppForm);
        expect(iotManager.iotAppExists("barapp")).to.be.false;

        fs.existsSync.restore();
    });

    it("getVersion should return the correct version additinated number", function() {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        const fs = require("fs-extra");
        sinon.stub(fs, "existsSync").callsFake((path) => {
            return true;
        });

        iotManager.registerLib("/tmp/foobar", "foolib", 11, {}, IotLibForm);
        iotManager.registerLib("/tmp/foobar", "foolib2", 5, {}, IotLibForm);
        iotManager.registerApp("/tmp/foobar", "fooapp", "Foo Bar", 72, "fooPlatform", "barBoard", "foobarFramework", ["foolib", "foolib2"], {foo:"bar"}, {}, IotAppForm);
        expect(iotManager.getVersion("fooapp")).to.be.equal(88);

        fs.existsSync.restore();
    });

    it("getVersion should return the correct original version", function() {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        const fs = require("fs-extra");
        sinon.stub(fs, "existsSync").callsFake((path) => {
            return true;
        });

        iotManager.registerApp("/tmp/foobar", "fooapp", "Foo Bar", 22, "fooPlatform", "barBoard", "foobarFramework", [], {foo:"bar"}, {}, IotAppForm);
        expect(iotManager.getVersion("fooapp")).to.be.equal(22);

        fs.existsSync.restore();
    });

    it("getIotApp should return the good app", function() {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        const fs = require("fs-extra");
        sinon.stub(fs, "existsSync").callsFake((path) => {
            return true;
        });

        iotManager.registerApp("/tmp/foobar", "fooapp", "Foo Bar", 22, "fooPlatform", "barBoard", "foobarFramework", [], {foo:"bar"}, {}, IotAppForm);
        expect(iotManager.getIotApp("fooapp").name).to.be.equal("Foo Bar");

        fs.existsSync.restore();
    });

    it("getIotApp should return null due to invalid app name", function() {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        const fs = require("fs-extra");
        sinon.stub(fs, "existsSync").callsFake((path) => {
            return true;
        });

        iotManager.registerApp("/tmp/foobar", "fooapp", "Foo Bar", 22, "fooPlatform", "barBoard", "foobarFramework", [], {foo:"bar"}, {}, IotAppForm);
        expect(iotManager.getIotApp("barapp")).to.be.null;

        fs.existsSync.restore();
    });

    it("addIngredientForReceipe should work well", function() {
        const iotManager = new IotManager.class(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager);
        const fs = require("fs-extra");
        sinon.stub(fs, "existsSync").callsFake((path) => {
            return true;
        });

        iotManager.registerLib("/tmp/foobar", "foolib", 2, {left:{"3V3":["foobar"]}}, IotLibForm);
        iotManager.addIngredientForReceipe("foolib", "foo", "bar", 32, true, true);
        iotManager.registerApp("/tmp/foobar", "fooapp", "Foo Bar", 5, "fooPlatform", "barBoard", "foobarFramework", ["foolib"], {foo:"bar"}, {right:{"GND":["barfoo"]}}, IotAppForm);
        iotManager.addIngredientForReceipe("fooapp", "bar", "foo", 3, false, false);
        expect(iotManager.iotApps["fooapp"].receipe.length).to.be.equal(2);

        fs.existsSync.restore();
    });

    after(() => {

    });
});
