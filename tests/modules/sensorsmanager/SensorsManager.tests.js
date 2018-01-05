/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var GlobalMocks = require("./../../GlobalMocks");

const SensorsManager = require("../../../src/modules/sensorsmanager/SensorsManager");
const PluginsManager = require("../../../src/modules/pluginsmanager/PluginsManager");

const formManager = {register:()=>{}};
const translateManager = {};
const themeManager = {};
const confManager = {loadData:()=>{}};
const eventBus = {on:()=>{}};
const webServices = {registerAPI:()=>{}};
const botEngine = {registerBotAction:()=>{}};
let initIndicator = false;
let statisticsParameters = null;
const pluginsManager = {getPluginByIdentifier:() => {
    return {
        sensorAPI:{
            sensorClass:class cl {
                constructor() {
                    this.configuration = {statistics:true, statisticsColor:"#FF0000"};
                    this.id = "foobar";
                }

                init() {
                    initIndicator = true;
                }

                getStatistics(timestampBegin, timestampEnd, granularity, cb, roundTimestampFunction = null, roundDateSqlFormat = null) {
                    const res = {unit:"test", values:{}};
                    res.values[timestampBegin] = 22;
                    res.values[timestampEnd] = 23;
                    cb(null, res);
                }
            }
        }
    };
}};

describe("SensorsManager", function() {

    before(() => {

    });

    it("constructor should init object", function() {
        sinon.spy(confManager, "loadData");
        sinon.spy(eventBus, "on");
        sinon.spy(webServices, "registerAPI");

        const sensorsManager = new SensorsManager.class(pluginsManager, eventBus, webServices, formManager, confManager, translateManager, themeManager, botEngine);
        expect(sensorsManager).to.have.property("pluginsManager");
        expect(sensorsManager).to.have.property("webServices");
        expect(sensorsManager).to.have.property("formManager");
        expect(sensorsManager).to.have.property("confManager");
        expect(sensorsManager).to.have.property("translateManager");
        expect(sensorsManager).to.have.property("themeManager");
        expect(sensorsManager).to.have.property("sensors");
        expect(sensorsManager).to.have.property("sensorsConfiguration");
        expect(sensorsManager).to.have.property("delegates");
        expect(sensorsManager.sensors instanceof Array).to.be.true;
        expect(sensorsManager.sensors.length).to.be.equal(0);
        expect(sensorsManager.sensorsConfiguration instanceof Array).to.be.true;
        expect(sensorsManager.sensorsConfiguration.length).to.be.equal(0);

        expect(confManager.loadData.calledOnce).to.be.true;
        expect(eventBus.on.calledOnce).to.be.true;
        expect(webServices.registerAPI.callCount).to.be.equal(7);

        confManager.loadData.restore();
        eventBus.on.restore();
        webServices.registerAPI.restore();

    });

    it("pluginsLoaded should call initSensors and set pluginsManager", function() {
        const sensorsManager = new SensorsManager.class(pluginsManager, eventBus, webServices, formManager, confManager, translateManager, themeManager, botEngine);
        sinon.stub(sensorsManager, "initSensors");

        sensorsManager.pluginsLoaded("foo", sensorsManager);
        expect(sensorsManager.initSensors.calledOnce).to.be.true;
        expect(sensorsManager.pluginsManager).to.be.equal("foo");

        sensorsManager.initSensors.restore();
    });

    it("initSensors should call initSensor 2 times", function() {
        const sensorsManager = new SensorsManager.class(pluginsManager, eventBus, webServices, formManager, confManager, translateManager, themeManager, botEngine);
        sensorsManager.sensorsConfiguration = ["foo", "bar"];
        sinon.stub(sensorsManager, "initSensor");

        sensorsManager.initSensors();
        expect(sensorsManager.initSensor.calledTwice).to.be.true;

        sensorsManager.initSensor.restore();
    });

    it("initSensor should instantiate an object", function() {
        initIndicator = false;
        const sensorsManager = new SensorsManager.class(pluginsManager, eventBus, webServices, formManager, confManager, translateManager, themeManager, botEngine);
        sensorsManager.initSensor({plugin:"foo"});
        expect(sensorsManager.sensors.length).to.be.equal(1);
        expect(initIndicator).to.be.true;
    });

    it("statisticsWsResponse should raise an error due to empty statistics", function() {
        const sensorsManager = new SensorsManager.class(pluginsManager, eventBus, webServices, formManager, confManager, translateManager, themeManager, botEngine);
        const p = sensorsManager.statisticsWsResponse(1501754581, 31 * 24 * 60 * 60, 60 * 60, "Y");

        p.then((msg) => {
            expect(false).to.be.true;
        })
        .catch((error) => {
            expect(error.errorCode).to.be.equal(8110);
            expect(true).to.be.true;
        });
    });

    it("statisticsWsResponse should send correct parameters to getStatistics", function() {
        const sensorsManager = new SensorsManager.class(pluginsManager, eventBus, webServices, formManager, confManager, translateManager, themeManager, botEngine);
        sensorsManager.initSensor({plugin:"foo"});
        statisticsParameters = null;
        const p = sensorsManager.statisticsWsResponse(1501754581, 31 * 24 * 60 * 60, 60 * 60, "foo", "bar", "foobar");

        p.then((msg) => {
            expect(msg.response.x.length).to.be.equal(2);
            expect(msg.response.x[0].ts).to.be.equal(1499076181);
            expect(msg.response.x[1].ts < 1504432981).to.be.true;
            expect(msg.response.test.foobar.color).to.be.equal("#FF0000");
            expect(msg.response.test.foobar.values.length).to.be.equal(2);
            expect(msg.response.test.foobar.values[0]).to.be.equal(22);
            expect(msg.response.test.foobar.values[1]).to.be.equal(23);
        })
        .catch((error) => {
            expect(false).to.be.true;
        });
    });

    it("register for sensor events should work as well", function() {
        const sensorsManager = new SensorsManager.class(pluginsManager, eventBus, webServices, formManager, confManager, translateManager, themeManager, botEngine);
        sensorsManager.registerSensorEvent((id, type, value, unit, vcc, aggValue, aggUnit) => { });
        expect(Object.keys(sensorsManager.delegates).length).to.be.equal(1);
        sensorsManager.registerSensorEvent((id, type, value, unit, vcc, aggValue, aggUnit) => { }, 22, "FOO");
        expect(Object.keys(sensorsManager.delegates).length).to.be.equal(2);
    });

    it("unregister for sensor events should work as well", function() {
        const sensorsManager = new SensorsManager.class(pluginsManager, eventBus, webServices, formManager, confManager, translateManager, themeManager, botEngine);
        const cb = (id, type, value, unit, vcc, aggValue, aggUnit) => {};
        sensorsManager.registerSensorEvent(cb);
        expect(Object.keys(sensorsManager.delegates).length).to.be.equal(1);
        sensorsManager.registerSensorEvent((id, type, value, unit, vcc, aggValue, aggUnit) => { }, 22, "FOO");
        expect(Object.keys(sensorsManager.delegates).length).to.be.equal(2);
        sensorsManager.unregisterSensorEvent(cb);
        expect(Object.keys(sensorsManager.delegates).length).to.be.equal(1);
    });

    it("unregister for sensor should throw an error due to unexisting element", function() {
        const sensorsManager = new SensorsManager.class(pluginsManager, eventBus, webServices, formManager, confManager, translateManager, themeManager, botEngine);
        const cb = (id, type, value, unit, vcc, aggValue, aggUnit) => {};
        sensorsManager.registerSensorEvent(cb);
        expect(Object.keys(sensorsManager.delegates).length).to.be.equal(1);
        try {
            sensorsManager.unregisterSensorEvent((id, type, value, unit, vcc, aggValue, aggUnit) => { }, 22, "FOO");
            expect(false).to.be.true;
        } catch(e) {
            expect(e.message).to.be.equal(SensorsManager.ERROR_NOT_REGISTERED);
        }
    });

    it("getAllSensors should return a list of sensors", function() {
        const sensorsManager = new SensorsManager.class(pluginsManager, eventBus, webServices, formManager, confManager, translateManager, themeManager, botEngine);
        sensorsManager.sensors.push({id:22,name:"foo"});
        sensorsManager.sensors.push({id:27, name:"bar"});
        expect(Object.keys(sensorsManager.getAllSensors()).length).to.be.equal(2);
        expect(sensorsManager.getAllSensors()[22]).to.be.equal("foo");
        expect(sensorsManager.getAllSensors()[27]).to.be.equal("bar");
    });

    after(() => {

    });
});
