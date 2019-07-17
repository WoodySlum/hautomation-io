/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var GlobalMocks = require("./../../GlobalMocks");

var DashboardManager = require("./../../../src/modules/dashboardmanager/DashboardManager");
const HautomationCore = require("./../../../src/HautomationCore").class;
const Tile = require("./../../../src/modules/dashboardmanager/Tile");
const core = new HautomationCore();
const webServices = core.webServices;
const translateManager = core.translateManager;
const themeManager = core.themeManager;
const confManager = core.confManager;
const scenarioManager = core.scenarioManager;

const TileFoo = new Tile.class(themeManager, "foo", Tile.TILE_INFO_ONE_TEXT, null, null, null, null, null, null, 0, 3);
const TileBar = new Tile.class(themeManager, "bar", Tile.TILE_INFO_ONE_TEXT, null, null, null, null, null, null, 0, 5);

describe("DashboardManager", function() {
    before(() => {

    });

    it("constructor should have correct parameters", function() {
        sinon.spy(webServices, "registerAPI");
        const dashboardManager = new DashboardManager.class(themeManager, webServices, translateManager, confManager, scenarioManager);
        expect(dashboardManager).to.have.property("themeManager");
        expect(dashboardManager).to.have.property("webServices");
        expect(dashboardManager).to.have.property("translateManager");
        expect(dashboardManager.tiles.length).to.be.equal(0);
        expect(dashboardManager.lastGenerated > 100000).to.be.true;
        expect(webServices.registerAPI.calledThrice).to.be.true;
        webServices.registerAPI.restore();
    });

    it("registerTile should register tile", function() {
        const dashboardManager = new DashboardManager.class(themeManager, webServices, translateManager, confManager, scenarioManager);
        dashboardManager.registerTile(TileFoo);
        dashboardManager.registerTile(TileBar);
        expect(dashboardManager.tiles.length).to.be.equal(2);
    });

    it("registerTile with same identifier should register only once", function() {
        const dashboardManager = new DashboardManager.class(themeManager, webServices, translateManager, confManager, scenarioManager);
        dashboardManager.registerTile(TileBar);
        const TileDuplicate = new Tile.class(themeManager, "bar", Tile.TILE_INFO_TWO_TEXT, null, null, null, null, null, null, 0, 5);
        dashboardManager.registerTile(TileDuplicate);
        expect(dashboardManager.tiles.length).to.be.equal(1);
    });

    it("registerTile should sort tile with order parameter", function() {
        const dashboardManager = new DashboardManager.class(themeManager, webServices, translateManager, confManager, scenarioManager);
        dashboardManager.registerTile(TileBar);
        dashboardManager.registerTile(TileFoo);
        expect(dashboardManager.tiles[0].identifier).to.be.equal("foo");
        expect(dashboardManager.tiles[1].identifier).to.be.equal("bar");
    });

    it("unregisterTile should remoe tile", function() {
        const dashboardManager = new DashboardManager.class(themeManager, webServices, translateManager, confManager, scenarioManager);
        dashboardManager.registerTile(TileBar);
        dashboardManager.registerTile(TileFoo);
        dashboardManager.unregisterTile("foo");
        expect(dashboardManager.tiles.length).to.be.equal(1);
        expect(dashboardManager.tiles[0].identifier).to.be.equal("bar");
    });

    it("buildDashboard should build a valid object", function() {
        const dashboardManager = new DashboardManager.class(themeManager, webServices, translateManager, confManager, scenarioManager);
        dashboardManager.registerTile(TileBar);
        dashboardManager.registerTile(TileFoo);
        dashboardManager.lastGenerated = 1499868105;
        const dashboard = dashboardManager.buildDashboard();
        expect(dashboard.tiles.length).to.be.equal(2);
        expect(dashboard.timestamp).to.be.equal(1499868105);
        expect(dashboard.timestampFormatted).to.be.not.null;
    });

    after(() => {

    });
});
