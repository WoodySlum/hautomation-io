/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

const sqlite3 = require("sqlite3");
const sha256 = require("sha256");

const DbManager = require("./../../../src/modules/dbmanager/DbManager");
const TimeEventService = require("./../../../src/services/timeeventservice/TimeEventService");
const SchedulerService = require("./../../../src/services/schedulerservice/SchedulerService");
const DateUtils = require("./../../../src/utils/DateUtils");

describe("SchedulerService", function() {
    const dbManager = new DbManager.class({db:""});
    const timeEventService = new TimeEventService.class();
    let schedulerService;

    before(() => {
        sinon.spy(dbManager, "initSchema");
        schedulerService = new SchedulerService.class(dbManager, timeEventService);
    });

    it("constuctor should initialize last triggered date to now", function() {
        expect(schedulerService.lastTriggered).to.be.within(DateUtils.class.timestamp() -1, DateUtils.class.timestamp());
        expect(schedulerService.dbSchema).to.be.not.null;
        expect(schedulerService.dbHelper).to.be.not.null;
        expect(dbManager.initSchema.calledOnce).to.be.true;
    });

    it("register should create a valid object", function() {
        function foobar(self) {

        }

        schedulerService.register("foobar", foobar);
        expect(schedulerService.registeredElements[sha256("foobar")]).to.be.equal(foobar);
    });

    it("unregister should delete object", function() {
        function foobar(self) {

        }

        schedulerService.register("foobar", foobar);
        schedulerService.unregister("foobar");
        expect(schedulerService.registeredElements[sha256("foobar")]).to.be.undefined;
    });

    it("schedule with constant should do the job", function() {
        function foobar(self) {

        }
        sinon.spy(schedulerService.dbHelper, "saveObject");
        schedulerService.register("foobar", foobar);
        schedulerService.schedule("foobar", SchedulerService.IN_A_HOUR);
        expect(schedulerService.dbHelper.saveObject.calledOnce).to.be.true;
        schedulerService.dbHelper.saveObject.restore();

    });

    after(() => {
        dbManager.initSchema.restore();
    });
});
