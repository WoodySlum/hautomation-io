/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

const HautomationCore = require("../../../src/HautomationCore").class;
const core = new HautomationCore();
const plugin = core.pluginsManager.getPluginByIdentifier("sensor", false);
const Sensor = plugin.exported.Sensor;

describe("Sensor", function() {
    before(() => {

    });

    it("constructor should have good parameters", function() {
        sinon.spy(plugin.databaseAPI, "register");
        let sensor = new Sensor(plugin, 30, {foo:"bar"}, "foo", 2, "bar", Sensor.constants().AGGREGATION_MODE_SUM, 3000, Sensor.constants().CHART_TYPE_BAR);
        expect(sensor).to.have.property("api");
        expect(sensor).to.have.property("icon");
        expect(sensor).to.have.property("id");
        expect(sensor).to.have.property("configuration");
        expect(sensor).to.have.property("aggregationMode");
        expect(sensor).to.have.property("dashboardGranularity");
        expect(sensor).to.have.property("chartType");
        expect(sensor).to.have.property("unitConverter");
        expect(sensor).to.have.property("unit");
        expect(sensor).to.have.property("unitAggregation");
        expect(sensor).to.have.property("round");

        expect(sensor.id).to.be.equal(30);
        expect(sensor.configuration.foo).to.be.equal("bar");
        expect(sensor.icon).to.be.equal("foo");
        expect(sensor.round).to.be.equal(2);
        expect(sensor.unit).to.be.equal("bar");
        expect(sensor.aggregationMode).to.be.equal(Sensor.constants().AGGREGATION_MODE_SUM);
        expect(sensor.dashboardGranularity).to.be.equal(3000);
        expect(sensor.chartType).to.be.equal(Sensor.constants().CHART_TYPE_BAR);

        expect(plugin.databaseAPI.register.calledOnce).to.be.true;
        plugin.databaseAPI.register.restore();
    });

    it("constructor should throw an error when configuration is null", function() {
        try {
            let sensor = new Sensor(plugin, 30);
            expect(false).to.be.true;
        } catch(e) {
            expect(e).to.be.not.null;
        }
    });

    it("init should call update tile", function() {
        let sensor = new Sensor(plugin, 30, {});
        sensor.unit = "foo";
        sinon.spy(sensor, "updateTile");
        sensor.init();
        expect(sensor.updateTile.calledOnce).to.be.true;
        sensor.updateTile.restore();
    });

    it("init should throw an error due to empty unit", function() {
        let sensor = new Sensor(plugin, 30, {});
        try {
            sensor.init();
            expect(false).to.be.true;
        } catch(e) {
            expect(e).to.be.not.null;
        }
    });

    after(() => {

    });
});
