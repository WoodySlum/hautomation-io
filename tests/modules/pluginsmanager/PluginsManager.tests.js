/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

var PluginsManager = require("./../../../src/modules/pluginsmanager/PluginsManager");
var PluginAPI = require("./../../../src/modules/pluginsmanager/PluginAPI");
var WebServices = require("./../../../src/services/webservices/WebServices");

describe("PluginsManager", function() {
    let pluginsManager;
    let webServices;
    let pluginA;
    let pluginB;
    let pluginC;
    let pluginD;
    let pluginInvalidDependencies;
    let pluginARef = {attributes : {
        loadedCallback: (api) => {},
        name: "a",
        version: "0.0.0",
        category: "misc",
        description: "desc",
        dependencies:["b"]
    }};
    let pluginBRef = {attributes : {
        loadedCallback: (api) => {},
        name: "b",
        version: "0.0.0",
        category: "misc",
        description: "desc"
    }};
    let pluginCRef = {attributes : {
        loadedCallback: (api) => {},
        name: "c",
        version: "0.0.0",
        category: "misc",
        description: "desc",
        dependencies:["a"]
    }};
    let pluginDRef = {attributes : {
        loadedCallback: (api) => {},
        name: "d",
        version: "0.0.0",
        category: "misc",
        description: "desc"
    }};
    let pluginInvalidAttRef = { attributes : {
        loadedCallback: (api) => {},
        version: "0.0.0",
        category: "misc",
        description: "desc"
    }};
    let pluginInvalidCallbackRef = { attributes : {
        loadedCallback: "cb",
        name:"invalid-callback",
        version: "0.0.0",
        category: "misc",
        description: "desc"
    }};
    let pluginInvalidDependenciesRef = { attributes : {
        loadedCallback: (api) => {},
        name:"invalid-callback",
        version: "0.0.0",
        category: "misc",
        description: "desc",
        dependencies:["a", "z"]
    }};



    before(() => {
        webServices = sinon.mock(WebServices.class);
        webServices.registerAPI = ()=>{};
        sinon.stub(PluginsManager.class.prototype, 'load');
        pluginsManager = new PluginsManager.class({}, webServices);
        pluginA = new PluginAPI.class("0.0.0", pluginARef, webServices);
        pluginB = new PluginAPI.class("0.0.0", pluginBRef, webServices);
        pluginC = new PluginAPI.class("0.0.0", pluginCRef, webServices);
        pluginD = new PluginAPI.class("0.0.0", pluginDRef, webServices);
        pluginInvalidDependencies = new PluginAPI.class("0.0.0", pluginInvalidDependenciesRef, webServices);

    });

    it("default constructor should call load in constructor", function() {
        expect(pluginsManager).to.have.property("plugins");
        expect(pluginsManager.plugins.length).to.be.equal(0);
        expect(pluginsManager.load.calledOnce).to.be.true;
    });

    it("sanitize should detect missing property", function() {
        try {
            pluginsManager.checkPluginSanity(pluginInvalidAttRef);
            expect(false).to.be.true; // This should not happened because an exception is thrown
        } catch (e) {
            expect(e.message).to.be.equal(PluginsManager.ERROR_MISSING_PROPERTY);
        }
    });

    it("sanitize should detect loaded callback", function() {
        try {
            pluginsManager.checkPluginSanity(pluginInvalidCallbackRef);
            expect(false).to.be.true; // This should not happened because an exception is thrown
        } catch (e) {
            expect(e.message).to.be.equal(PluginsManager.ERROR_NOT_A_FUNCTION);
        }
    });

    it("sanitize should detect not loaded depedencies", function() {
        try {
            pluginsManager.checkPluginSanity(pluginInvalidDependenciesRef, [pluginA, pluginInvalidDependencies]);
            expect(false).to.be.true; // This should not happened because an exception is thrown
        } catch (e) {
            expect(e.message).to.be.equal(PluginsManager.ERROR_DEPENDENCY_NOT_FOUND);
        }
    });

    // Toposort testing function

    it("should prepare array for toposort", function() {
        const preparedArray = pluginsManager.prepareToposortArray([pluginA, pluginB, pluginC, pluginD].slice());
        expect(preparedArray[0][0]).to.be.equal("a");
        expect(preparedArray[0][1]).to.be.equal("b");
        expect(preparedArray[1][0]).to.be.equal("b");
        expect(preparedArray[2][0]).to.be.equal("c");
        expect(preparedArray[2][1]).to.be.equal("a");
        expect(preparedArray[3][0]).to.be.equal("d");

    });

    it("should sort plugin identifiers with deopendencies", function() {
        const preparedArray = pluginsManager.prepareToposortArray([pluginA, pluginB, pluginC, pluginD]);
        const sortedArray = pluginsManager.toposort(preparedArray);
        // d, b, a, c
        expect(sortedArray.length).to.be.equal(4);
        expect(sortedArray[0]).to.be.equal("d");
        expect(sortedArray[1]).to.be.equal("b");
        expect(sortedArray[2]).to.be.equal("a");
        expect(sortedArray[3]).to.be.equal("c");
    });

    it("should convert sorted array identifier into plugins", function() {
        const plugins = [pluginA, pluginB, pluginC, pluginD];
        const preparedArray = pluginsManager.prepareToposortArray(plugins);
        const toposortedArray = pluginsManager.toposort(preparedArray);
        const sortedPlugins = pluginsManager.topsortedArrayConverter(toposortedArray, plugins);
        // d, b, a, c
        expect(sortedPlugins.length).to.be.equal(4);
        expect(sortedPlugins[0] instanceof PluginAPI.class).to.be.true;
        expect(sortedPlugins[0].identifier).to.be.equal("d");
        expect(sortedPlugins[1] instanceof PluginAPI.class).to.be.true;
        expect(sortedPlugins[1].identifier).to.be.equal("b");
        expect(sortedPlugins[2] instanceof PluginAPI.class).to.be.true;
        expect(sortedPlugins[2].identifier).to.be.equal("a");
        expect(sortedPlugins[3] instanceof PluginAPI.class).to.be.true;
        expect(sortedPlugins[3].identifier).to.be.equal("c");
    });

    after(function () {
        //pluginsManager.restore();
    });
});
