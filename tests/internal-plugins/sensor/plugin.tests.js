/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

const DateUtils = require("../../../src/utils/DateUtils");
const HautomationCore = require("../../../src/HautomationCore").class;
const core = new HautomationCore();
const plugin = core.pluginsManager.getPluginByIdentifier("sensor", false);
const Sensor = plugin.exported.Sensor;

describe("Sensor", function() {
    before(() => {

    });

    it("constructor should have good parameters", function() {
        sinon.spy(plugin.databaseAPI, "register");
        let sensor = new Sensor(plugin, 30, "FOOBAR",{foo:"bar"}, "foo", 2, "bar", Sensor.constants().AGGREGATION_MODE_SUM, 3000, Sensor.constants().CHART_TYPE_BAR);
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
            let sensor = new Sensor(plugin, 30, "FOOBAR");
            expect(false).to.be.true;
        } catch(e) {
            expect(e).to.be.not.null;
        }
    });

    it("constructor should throw an error when type is null", function() {
        try {
            let sensor = new Sensor(plugin, 30, null, {});
            expect(false).to.be.true;
        } catch(e) {
            expect(e).to.be.not.null;
        }
    });

    it("constructor should throw an error when id is null", function() {
        try {
            let sensor = new Sensor(plugin, null, "FOOBAR", {});
            expect(false).to.be.true;
        } catch(e) {
            expect(e).to.be.not.null;
        }
    });

    it("init should call update tile", function() {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.unit = "foo";
        sinon.spy(sensor, "updateTile");
        sensor.init();
        expect(sensor.updateTile.calledOnce).to.be.true;
        sensor.updateTile.restore();
    });

    it("init should throw an error due to empty unit", function() {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        try {
            sensor.init();
            expect(false).to.be.true;
        } catch(e) {
            expect(e).to.be.not.null;
        }
    });

    it("addUnitAggregation should update class property", function() {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.addUnitAggregation("foo", 1000);
        sensor.addUnitAggregation("bar", 2000);
        expect(Object.keys(sensor.unitAggregation).length).to.be.equal(2);
        expect(sensor.unitAggregation[1000]).to.be.equal("foo");
        expect(sensor.unitAggregation[2000]).to.be.equal("bar");
    });

    it("aggregateUnit should do the job", function() {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.unit = "foo";
        expect(sensor.aggregateUnit(1500).value).to.be.equal(1500);
        expect(sensor.aggregateUnit(1500).unit).to.be.equal("foo");

        sensor.addUnitAggregation("bar", 1000);
        sensor.addUnitAggregation("rab", 2000);

        expect(sensor.aggregateUnit(1500).value).to.be.equal(1.5);
        expect(sensor.aggregateUnit(1500).unit).to.be.equal("bar");

        expect(sensor.aggregateUnit(2100).value).to.be.equal(1.05);
        expect(sensor.aggregateUnit(2100).unit).to.be.equal("rab");

        expect(sensor.aggregateUnit(200, "bar").value).to.be.equal(0.2);
        expect(sensor.aggregateUnit(200, "bar").unit).to.be.equal("bar");
    });

    it("convertValue should do all conversion job", function() {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.unit = "foo";
        sensor.round = 2;
        sensor.unitConverter = (val) => {
            return val / 7;
        }
        sensor.addUnitAggregation("bar", 1000);

        sinon.spy(sensor, "aggregateUnit");
        sinon.spy(sensor, "unitConverter");

        expect(sensor.convertValue(500).value).to.be.equal(71.43);
        expect(sensor.aggregateUnit.calledOnce).to.be.true;
        expect(sensor.unitConverter.calledOnce).to.be.true;

        expect(sensor.convertValue(500).unit).to.be.equal("foo");

        expect(sensor.convertValue(7700).value).to.be.equal(1.1);
        expect(sensor.convertValue(7700).unit).to.be.equal("bar");

        sensor.aggregateUnit.restore();
        sensor.unitConverter.restore();

    });

    it("lastObject with avg aggregation should report the good value", function(done) {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.unit = "foo";
        sensor.round = 2;
        sensor.id = "fooavg";
        sensor.aggregationMode = Sensor.constants().AGGREGATION_MODE_AVG;
        const db1  = new plugin.exported.DbSensor(sensor.dbHelper, 32, "fooavg", 23);
        const db2  = new plugin.exported.DbSensor(sensor.dbHelper, 21, "fooavg", 21);

        db1.save((error) => {
            db2.save((error) => {
                sensor.lastObject((err, res) => {
                    expect(error).to.be.null;
                    expect(res.value).to.be.equal(26.5);
                    expect(res.vcc).to.be.equal(21);
                    done();
                }, 360);
            });
        });
    });

    it("lastObject with sum aggregation should report the good value", function(done) {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.unit = "foo";
        sensor.round = 2;
        sensor.id = "foosum";
        sensor.aggregationMode = Sensor.constants().AGGREGATION_MODE_SUM;
        const db1  = new plugin.exported.DbSensor(sensor.dbHelper, 32, "foosum", 23);
        const db2  = new plugin.exported.DbSensor(sensor.dbHelper, 20.3, "foosum", 11);

        db1.save((error) => {
            db2.save((error) => {
                sensor.lastObject((err, res) => {
                    expect(error).to.be.null;
                    expect(res.value).to.be.equal(52.3);
                    expect(res.vcc).to.be.equal(11);
                    done();
                }, 360);
            });
        });
    });

    it("lastObject with min aggregation should report the good value", function(done) {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.unit = "foo";
        sensor.round = 2;
        sensor.id = "foomin";
        sensor.aggregationMode = Sensor.constants().AGGREGATION_MODE_MIN;
        const db1  = new plugin.exported.DbSensor(sensor.dbHelper, 32, "foomin", 23);
        const db2  = new plugin.exported.DbSensor(sensor.dbHelper, 20.3, "foomin", 11);

        db1.save((error) => {
            db2.save((error) => {
                sensor.lastObject((err, res) => {
                    expect(error).to.be.null;
                    expect(res.value).to.be.equal(20.3);
                    expect(res.vcc).to.be.equal(11);
                    done();
                }, 360);
            });
        });
    });

    it("lastObject with max aggregation should report the good value", function(done) {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.unit = "foo";
        sensor.round = 2;
        sensor.id = "foomax";
        sensor.aggregationMode = Sensor.constants().AGGREGATION_MODE_MAX;
        const db1  = new plugin.exported.DbSensor(sensor.dbHelper, 32, "foomax", 23);
        const db2  = new plugin.exported.DbSensor(sensor.dbHelper, 20.3, "foomax", 11);

        db1.save((error) => {
            db2.save((error) => {
                sensor.lastObject((err, res) => {
                    expect(error).to.be.null;
                    expect(res.value).to.be.equal(32);
                    expect(res.vcc).to.be.equal(11);
                    done();
                }, 360);
            });
        });
    });

    it("lastObject without period should report the good value", function(done) {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.unit = "foo";
        sensor.round = 2;
        sensor.id = "foofoo";
        sensor.aggregationMode = Sensor.constants().AGGREGATION_MODE_MAX;
        const db1  = new plugin.exported.DbSensor(sensor.dbHelper, 32, "foofoo", 23);
        const db2  = new plugin.exported.DbSensor(sensor.dbHelper, 20.3, "foofoo", 11);

        db1.save((error) => {
            db2.save((error) => {
                sensor.lastObject((err, res) => {
                    expect(error).to.be.null;
                    expect(res.value).to.be.equal(20.3);
                    expect(res.vcc).to.be.equal(11);
                    done();
                });
            });
        });
    });

    it("updateTile should call registerTile", function(done) {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.unit = "foo";
        sensor.round = 2;
        sensor.id = "foofoo";
        sensor.aggregationMode = Sensor.constants().AGGREGATION_MODE_MAX;
        sinon.spy(plugin.dashboardAPI, "registerTile");
        sensor.updateTile(() => {
            expect(plugin.dashboardAPI.registerTile.calledOnce).to.be.true;
            plugin.dashboardAPI.registerTile.restore();
            done();
        });
    });

    it("updateTile should call unregisterTile", function(done) {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.unit = "foo";
        sensor.round = 2;
        sensor.id = "foofoofoo";
        sensor.aggregationMode = Sensor.constants().AGGREGATION_MODE_MAX;
        sinon.spy(plugin.dashboardAPI, "unregisterTile");
        sensor.updateTile(() => {
            expect(plugin.dashboardAPI.unregisterTile.calledOnce).to.be.true;
            plugin.dashboardAPI.unregisterTile.restore();
            done();
        });
    });

    it("setValue should store raw value in database", function(done) {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.unit = "foo";
        sensor.round = 2;
        sensor.id = "foofoofoofoo";
        sensor.aggregationMode = Sensor.constants().AGGREGATION_MODE_MAX;
        sinon.spy(sensor, "updateTile");
        sensor.setValue(67, 10, (err) => {
            expect(sensor.updateTile.calledOnce).to.be.true;
            expect(err).to.be.null;
            sensor.updateTile.restore();
            sensor.lastObject((err, res) => {
                expect(res.value).to.be.equal(67);
                expect(res.vcc).to.be.equal(10);
                done();
            });
        });
    });

    it("setValue should dispatch value", function() {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.unit = "foo";
        sensor.round = 2;
        sensor.id = "foofoofoofoo";
        sensor.aggregationMode = Sensor.constants().AGGREGATION_MODE_MAX;
        sinon.spy(sensor, "updateTile");
        sinon.spy(plugin.sensorAPI, "onNewSensorValue");
        sensor.setValue(67, 10, (err) => {});
        expect(plugin.sensorAPI.onNewSensorValue.calledOnce).to.be.true;
        plugin.sensorAPI.onNewSensorValue.restore();
    });

    it("roundTimestamp should round to lower timestamp", function() {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        expect(sensor.roundTimestamp(1501615834, 60 * 60)).to.be.equal(1501614000);
        expect(sensor.roundTimestamp(1501615834, 24 * 60 * 60)).to.be.equal(1501545600);
    });

    it("getStatistics day should return the complete list of aggregated values", function(done) {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.unit = "foo";
        sensor.round = 2;
        sensor.id = "foofoofoofoofoo";
        sensor.aggregationMode = Sensor.constants().AGGREGATION_MODE_AVG;
        const val1  = new plugin.exported.DbSensor(sensor.dbHelper, 32.8, "foofoofoofoofoo", 23);
        val1.timestamp = "'2017-07-13 00:05:24'";
        const val2  = new plugin.exported.DbSensor(sensor.dbHelper, 22.3, "foofoofoofoofoo", 23);
        val2.timestamp = "'2017-07-13 00:17:43'";
        const val3  = new plugin.exported.DbSensor(sensor.dbHelper, 17, "foofoofoofoofoo", 23);
        val3.timestamp = "'2017-07-13 07:22:04'";

        val1.save((error) => {
            val2.save((error) => {
                val3.save((error) => {
                    // sensor.dbHelper.getObjects(sensor.dbHelper.RequestBuilder().select().where("sensorId", "=", "foofoofoofoofoo"), (error, objects) => {
                    //     console.log(objects);
                    //     done();
                    // });
                    // sensor.lastObject((err, res) => {
                    //     console.log(res);
                    //     done();
                    // });
                    sensor.getStatistics(1499897104, 1499897104 + (24 * 60 * 60), (60 * 60), (err, results) => {
                        expect(err).to.be.null;
                        expect(results.unit).to.be.equal("foo");
                        expect(Object.keys(results.values).length).to.be.equal(25);
                        expect(results.values["1499904000"]).to.be.equal(27.55);
                        expect(results.values["1499929200"]).to.be.equal(17);
                        expect(Object.keys(results.values)[0]).to.be.equal('1499896800');
                        expect(Object.keys(results.values)[24]).to.be.equal('1499983200');
                        done();
                    });
                });
            });
        });
    });

    it("getStatistics month should return the complete list of aggregated values", function(done) {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.unit = "foo";
        sensor.round = 2;
        sensor.id = "foofoofoofoofoofoo";
        sensor.aggregationMode = Sensor.constants().AGGREGATION_MODE_SUM;
        sensor.addUnitAggregation("bar", 20);

        const val1  = new plugin.exported.DbSensor(sensor.dbHelper, 18.945, "foofoofoofoofoofoo", 23);
        val1.timestamp = "'2017-07-07 00:05:24'";
        const val2  = new plugin.exported.DbSensor(sensor.dbHelper, 17.312, "foofoofoofoofoofoo", 23);
        val2.timestamp = "'2017-07-07 00:17:43'";
        const val3  = new plugin.exported.DbSensor(sensor.dbHelper, 17, "foofoofoofoofoofoo", 23);
        val3.timestamp = "'2017-07-13 07:22:04'";

        val1.save((error) => {
            val2.save((error) => {
                val3.save((error) => {
                    sensor.getStatistics(1499144643, 1499144643 + (31 * 24 * 60 * 60), (24 * 60 * 60), (err, results) => {
                        expect(err).to.be.null;
                        expect(results.unit).to.be.equal("bar");
                        expect(Object.keys(results.values).length).to.be.equal(32);
                        expect(results.values["1499385600"]).to.be.equal(1.81);
                        expect(results.values["1499904000"]).to.be.equal(0.85);
                        expect(Object.keys(results.values)[0]).to.be.equal('1499126400');
                        expect(Object.keys(results.values)[31]).to.be.equal('1501804800');
                        done();
                    });
                });
            });
        });
    });

    it("getStatistics year should return the complete list of aggregated values", function(done) {
        let sensor = new Sensor(plugin, 30, "FOOBAR", {});
        sensor.unit = "foo";
        sensor.round = 2;
        sensor.id = "foofoofoofoofoofoofoo";
        sensor.aggregationMode = Sensor.constants().AGGREGATION_MODE_MIN;
        sensor.addUnitAggregation("bar", 20);

        const val1  = new plugin.exported.DbSensor(sensor.dbHelper, 18.945, "foofoofoofoofoofoofoo", 23);
        val1.timestamp = "'2017-03-03 03:05:24'";
        const val2  = new plugin.exported.DbSensor(sensor.dbHelper, 17.312, "foofoofoofoofoofoofoo", 23);
        val2.timestamp = "'2017-03-12 22:17:43'";
        const val3  = new plugin.exported.DbSensor(sensor.dbHelper, 17, "foofoofoofoofoofoofoo", 23);
        val3.timestamp = "'2017-05-13 07:22:04'";

        val1.save((error) => {
            val2.save((error) => {
                val3.save((error) => {

                    sensor.getStatistics(1467623167, 1467623167 + (365 * 24 * 60 * 60), (31 * 24 * 60 * 61), (err, results) => {
                        expect(err).to.be.null;
                        expect(results.unit).to.be.equal("foo");
                        expect(Object.keys(results.values).length).to.be.equal(13);
                        expect(results.values["1488326400"]).to.be.equal(17.31);
                        expect(results.values["1493596800"]).to.be.equal(17);
                        expect(Object.keys(results.values)[0]).to.be.equal('1467331200');
                        expect(Object.keys(results.values)[12]).to.be.equal('1498867200');

                        done();
                    }, (timestamp) => {
                        return DateUtils.class.roundedTimestamp(timestamp, DateUtils.ROUND_TIMESTAMP_MONTH);
                    }, "%Y-%m-01 00:00:00");
                });
            });
        });
    });

    after(() => {

    });
});
