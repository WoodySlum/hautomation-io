/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

const MessageManager = require("./../../../src/modules/messagemanager/MessageManager");
const HautomationCore = require("./../../../src/HautomationCore").class;
const core = new HautomationCore();
core.eventBus.on(core.pluginsManager.EVENT_LOADED, (pluginsManager) => {
    const eventBus = {on:()=>{}};

    const userManager = core.userManager;
    const dbManager = core.dbManager;
    const translateManager = core.translateManager;
    const webServices = core.webServices;
    const dashboardManager = core.dashboardManager;

    class FooBar {
        constructor() {

        }

        onMessageReceived(message) {

        }
    }

    class BarFoo {
        constructor() {

        }
    }

    describe("MessageManager", function() {
        before(() => {

        });

        it("constructor should initialize stuff correctly", function() {
            sinon.spy(eventBus, "on");
            sinon.spy(dbManager, "initSchema");
            sinon.spy(webServices, "registerAPI");
            sinon.spy(dashboardManager, "registerTile");
            const mm = new MessageManager.class(null, eventBus, userManager, dbManager, webServices, translateManager, dashboardManager);
            expect(eventBus.on.calledOnce).to.be.true;
            expect(dbManager.initSchema.calledOnce).to.be.true;
            expect(mm).to.have.property("dbHelper");
            expect(mm.dbHelper).to.be.not.null;
            expect(mm).to.have.property("userManager");
            expect(mm.userManager).to.be.equal(userManager);
            expect(mm).to.have.property("dbManager");
            expect(mm).to.have.property("registered");
            expect(mm.registered.length).to.be.equal(0);
            expect(webServices.registerAPI.calledTwice).to.be.true;
            expect(dashboardManager.registerTile.calledOnce).to.be.true;
            eventBus.on.restore();
            dbManager.initSchema.restore();
            webServices.registerAPI.restore();
            dashboardManager.registerTile.restore();
        });

        it("register should be well done", function() {
            const mm = new MessageManager.class(null, eventBus, userManager, dbManager, webServices, translateManager, dashboardManager);
            const foobar = new FooBar();
            mm.register(foobar);
            expect(mm.registered.length).to.be.equal(1);
            expect(mm.registered[0]).to.be.equal(foobar);
        });

        it("unregister should be well done", function() {
            const mm = new MessageManager.class(null, eventBus, userManager, dbManager, webServices, translateManager, dashboardManager);
            const foobar = new FooBar();
            mm.register(foobar);
            expect(mm.registered.length).to.be.equal(1);
            mm.unregister(foobar)
            expect(mm.registered.length).to.be.equal(0);
        });

        it("onMessageReceived should notify registered elements", function() {
            sinon.stub(userManager, "getUsers").returns([{username:"foo"}]);
            const mm = new MessageManager.class(null, eventBus, userManager, dbManager, webServices, translateManager, dashboardManager);

            const foobar = new FooBar();
            sinon.spy(foobar, "onMessageReceived");
            mm.register(foobar);
            mm.onMessageReceived("foo", "Hello world");
            expect(foobar.onMessageReceived.calledOnce).to.be.true;
            expect(foobar.onMessageReceived.args[0][0].message).to.be.equal("Hello world");
            expect(foobar.onMessageReceived.args[0][0].sender).to.be.equal("foo");
            userManager.getUsers.restore();
        });

        after(() => {

        });
    });
});
