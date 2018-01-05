/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var GlobalMocks = require("./../../GlobalMocks");

var TranslateManager = require("./../../../src/modules/translatemanager/TranslateManager");
var WebServices = require("./../../../src/services/webservices/WebServices");
var APIResponse = require("./../../../src/services/webservices/APIResponse");
var Authentication = require("./../../../src/modules/authentication/Authentication");
var AuthenticationData = require("./../../../src/modules/authentication/AuthenticationData")

const translateManager = new TranslateManager.class("en");

class APIResgistrationClassA {
    constructor(apiResponse = null, reject = false, empty = false){this.apiResponse = apiResponse; this.reject = reject; this.empty = empty;}
    processAPI(apiRequest) {
        return new Promise((resolve, reject) => {
            if (this.reject) {
                if (this.empty) {
                    reject();
                } else {
                    reject(this.apiResponse);
                }
            } else {
                if (this.empty) {
                    resolve();
                } else {
                    resolve(this.apiResponse);
                }
            }
         } );
    }
}
class APIResgistrationClassB extends APIResgistrationClassA {}

describe("WebServices", function() {
    let contentTypeGet = [];
    contentTypeGet[WebServices.CONTENT_TYPE] = WebServices.HEADER_APPLICATION_JSON;
    let contentTypePost = [];
    contentTypePost[WebServices.CONTENT_TYPE] = WebServices.HEADER_APPLICATION_FORM;
    const reqGet = {method:"GET", ip:"127.0.0.1", path:"/s/foo/bar/", query:{"foo":"bar"}, headers:contentTypeGet};
    const reqPost = {method:"POST", ip:"127.0.0.1", path:"/s/foo/bar/", body:{"foo":"bar"}, headers:contentTypePost};

    const endpoint = "/s/";

    before(() => {

    });

    /**
     * Constructor tests
     */
    it("constructor should be well played", function() {
        let w = new WebServices.class(translateManager, 9090, 9091);
        expect(w).to.have.property("port").and.equal(9090);
        expect(w).to.have.property("sslPort").and.equal(9091);
        expect(w).to.have.property("app").and.to.be.not.null;
        expect(w).to.have.property("servers");
        expect(w.servers.length).to.be.equal(0);
    });

    /**
     * API Registration tests
     */
     it("should register with wilcard route and method", function() {
         let w = new WebServices.class(translateManager, 8080);
         let obj = new APIResgistrationClassA();
         w.register(obj);
         expect(w.delegates.length).to.be.equal(1);
         expect(w.delegates[0].method).to.be.equal("*");
         expect(w.delegates[0].route).to.be.equal("*");
     });

     it("should register with specific route and method", function() {
         let w = new WebServices.class(8080);
         let obj = new APIResgistrationClassA();
         w.registerAPI(obj, WebServices.POST, ":/foo/bar/");
         expect(w.delegates.length).to.be.equal(1);
         expect(w.delegates[0].method).to.be.equal(WebServices.POST);
         expect(w.delegates[0].route).to.be.equal(":/foo/bar/");
     });

     it("should unregister with wilcard route and method", function() {
         let w = new WebServices.class(8080);
         let obj = new APIResgistrationClassA();
         w.register(obj);
         expect(w.delegates.length).to.be.equal(1);
         w.unregister(obj);
         expect(w.delegates.length).to.be.equal(0);
     });

     it("should unregister with specific route and method", function() {
         let w = new WebServices.class(8080);
         let obj = new APIResgistrationClassA();
         w.registerAPI(obj, WebServices.GET, ":/bar/foo/");
         expect(w.delegates.length).to.be.equal(1);
         w.unregisterAPI(obj, WebServices.GET, ":/bar/foo/");
         expect(w.delegates.length).to.be.equal(0);
     });

    /**
     * Manage response tests
     */
    it("manageResponse should return valid GET APIRequest", function() {
        let w = new WebServices.class(9090);
        let r = w.manageResponse(reqGet, endpoint);
        expect(r).to.be.an("Object");
        expect(r.method).to.be.equal("GET");
        expect(r.ip).to.be.equal("127.0.0.1");
        expect(r.route).to.be.equal(":/foo/bar/");
        expect(r.path.length).to.be.equal(1);
        expect(r.path[0]).to.be.equal("bar");
        expect(r.path[0]).to.be.equal("bar");
        expect(r.action).to.be.equal("foo");
        expect(r.params.foo).to.be.equal("bar");
        expect(r.data).to.be.empty;
        expect(r.authenticationData).to.be.null;
    });

    it("manageResponse should return valid POST APIRequest", function() {
        let w = new WebServices.class(9090);
        let r = w.manageResponse(reqPost, endpoint);
        expect(r).to.be.an("Object");
        expect(r.method).to.be.equal("POST");
        expect(r.ip).to.be.equal("127.0.0.1");
        expect(r.route).to.be.equal(":/foo/bar/");
        expect(r.path.length).to.be.equal(1);
        expect(r.path[0]).to.be.equal("bar");
        expect(r.path[0]).to.be.equal("bar");
        expect(r.action).to.be.equal("foo");
        expect(r.params.foo).to.be.equal("bar");
        expect(r.data).to.be.empty;
        expect(r.authenticationData).to.be.null;
    });

    /**
     * Build promises tests
     */
    it("buildPromises should return an array of promises", function() {
        let w = new WebServices.class(9090);
        w.register({
            processAPI : function(apiRequest) {
                return new Promise((resolve, reject) => {
                    resolve(new APIResponse.class(true, {"foo":"bar"}));
                 } );
            }
        });

        let r = w.manageResponse(reqPost, endpoint);
        let p = w.buildPromises(r);
        expect(p).to.be.an("Array");
        expect(p.length).to.be.equal(1);
        expect(p[0]).to.be.an("Promise");
    });

    it("array of buildPromises should return an array of promises", function() {
        let w = new WebServices.class(9090);
        w.register({
            processAPI : function(apiRequest) {
                return [new Promise((resolve, reject) => {
                    resolve(new APIResponse.class(true, {"foo":"bar"}));
                }), new Promise((resolve, reject) => {
                    resolve(new APIResponse.class(true, {"bar":"foo"}));
                })];
            }
        });

        let r = w.manageResponse(reqPost, endpoint);
        let p = w.buildPromises(r);
        expect(p).to.be.an("Array");
        expect(p.length).to.be.equal(2);
        expect(p[0]).to.be.an("Promise");
        expect(p[1]).to.be.an("Promise");
    });

    it("buildPromises should return the params as specified in routing", function(done) {
        let w = new WebServices.class(9090);

        w.registerAPI({
            processAPI : function(apiRequest) {
                expect(apiRequest.data.param1).to.be.equal("foo");
                expect(apiRequest.data.param2).to.be.equal("bar");
                expect(apiRequest.data.param3).to.be.equal("foobar");
                done();
                return new Promise((resolve, reject) => {
                    resolve(new APIResponse.class(true, {"foo":"bar"}));
                 } );
            }
        }, "*", ":/test/[param1]/[param2]/[param3*]/");

        let r = w.manageResponse({method:"POST", ip:"127.0.0.1", path:"/api/test/foo/bar/foobar/", body:{"foo":"bar"}, headers:contentTypePost}, "/api/");
        let p = w.buildPromises(r);
    });

    it("buildPromises should return the params as specified in routing with optional values", function(done) {
        let w = new WebServices.class(9090);

        w.registerAPI({
            processAPI : function(apiRequest) {
                expect(apiRequest.data.param1).to.be.equal("foo");
                expect(apiRequest.data.param2).to.be.equal("bar");
                expect(apiRequest.data.param3).to.be.null;
                done();
                return new Promise((resolve, reject) => {
                    resolve(new APIResponse.class(true, {"foo":"bar"}));
                 } );
            }
        }, "*", ":/test/[param1]/[param2]/[param3*]/");

        let r = w.manageResponse({method:"POST", ip:"127.0.0.1", path:"/api/test/foo/bar", body:{"foo":"bar"}, headers:contentTypePost}, "/api/");
        let p = w.buildPromises(r);
    });

    it("buildPromises should fail due to missing parameters", function() {
        let w = new WebServices.class(9090);

        w.registerAPI({
            processAPI : function(apiRequest) {
                expect(false).to.be.true;
                return new Promise((resolve, reject) => {
                    resolve(new APIResponse.class(true, {"foo":"bar"}));
                 } );
            }
        }, "*", ":/test/[param1]/[param2]/[param3*]/");

        let r = w.manageResponse({method:"POST", ip:"127.0.0.1", path:"/api/test/foo/", body:{"foo":"bar"}, headers:contentTypePost}, "/api/");
        let p = w.buildPromises(r);

        expect(p.length).to.be.equal(1);
        p[0].then((resolve, reject) => {
            expect(false).to.be.true;
        }).catch((e) =>{
            expect(e).to.be.not.null;
        });
    });

    /**
     * Run promises tests
     */
    it("runPromises should go well with 2 success", function(done) {
        let w = new WebServices.class(9090);

        w.register(new APIResgistrationClassA(new APIResponse.class(true, {"foo":"bar"})));
        w.register(new APIResgistrationClassB(new APIResponse.class(true, {"foo":"bar"})));

        let r = w.manageResponse(reqPost, endpoint);
        let p = w.buildPromises(r);

        let v = function(apiResponses) {
            expect(apiResponses.length).to.be.equal(2);
            expect(apiResponses[0].success).to.be.true;
            expect(apiResponses[1].success).to.be.true;
            done();
        }

        let sendAPIResponse = sinon.stub(w, "sendAPIResponse").callsFake((apiResponses, res) => {
            v(apiResponses);
        });

        w.runPromises(reqPost, p , null);
    });

    it("runPromises should get only one APIResult with first promise in error", function(done) {
        let w = new WebServices.class(9090);

        w.register(new APIResgistrationClassA(new APIResponse.class(false, {"foo":"bar"}), true));
        w.register(new APIResgistrationClassB(new APIResponse.class(true, {"foo":"bar"})));

        let r = w.manageResponse(reqPost, endpoint);
        let p = w.buildPromises(r);

        let v = function(apiResponses) {
            expect(apiResponses.length).to.be.equal(1);
            expect(apiResponses[0].success).to.be.false;
            done();
        }

        let sendAPIResponse = sinon.stub(w, "sendAPIResponse").callsFake((apiResponses, res) => {
            v(apiResponses);
        });

        w.runPromises(reqPost, p , null);
    });

    it("runPromises should go get only one APIResult with second promise in error", function(done) {
        let w = new WebServices.class(9090);

        w.register(new APIResgistrationClassA(new APIResponse.class(true, {"foo":"bar"})));
        w.register(new APIResgistrationClassB(new APIResponse.class(false, {"foo":"bar"}, 100, "foo"), true));

        let r = w.manageResponse(reqPost, endpoint);
        let p = w.buildPromises(r);

        let v = function(apiResponses) {
            expect(apiResponses.length).to.be.equal(1);
            expect(apiResponses[0].success).to.be.false;
            expect(apiResponses[0].errorCode).to.be.equal(100);
            expect(apiResponses[0].errorMessage).to.be.equal("foo");

            done();
        }

        let sendAPIResponse = sinon.stub(w, "sendAPIResponse").callsFake((apiResponses, res) => {
            v(apiResponses);
        });

        w.runPromises(reqPost, p , null);
    });

    it("runPromises should go well with empty resolve content", function(done) {
        let w = new WebServices.class(9090);

        w.register(new APIResgistrationClassA(null, false, true));
        w.register(new APIResgistrationClassB(new APIResponse.class(true, {"foo":"bar"}), true));

        let r = w.manageResponse(reqPost, endpoint);
        let p = w.buildPromises(r);

        let v = function(apiResponses) {
            expect(apiResponses.length).to.be.equal(1);
            expect(apiResponses[0].success).to.be.true;
            done();
        }

        let sendAPIResponse = sinon.stub(w, "sendAPIResponse").callsFake((apiResponses, res) => {
            v(apiResponses);
        });

        w.runPromises(reqPost, p , null);
    });

    it("runPromises should go well with specific route registering", function(done) {
        let w = new WebServices.class(9090);

        w.registerAPI(new APIResgistrationClassA(new APIResponse.class(true, {"foo":"bar"})), WebServices.POST, ":/foo/bar/");

        let r = w.manageResponse(reqPost, endpoint);
        let p = w.buildPromises(r);

        let v = function(apiResponses) {
            expect(apiResponses.length).to.be.equal(1);
            expect(apiResponses[0].success).to.be.true;
            done();
        }

        let sendAPIResponse = sinon.stub(w, "sendAPIResponse").callsFake((apiResponses, res) => {
            v(apiResponses);
        });

        w.runPromises(reqPost, p , null);
    });

    it("runPromises should go wrong with specific route registering", function(done) {
        let w = new WebServices.class(9090);

        w.registerAPI(new APIResgistrationClassA(new APIResponse.class(true, {"foo":"bar"})), WebServices.POST, ":/bar/foo/");

        let r = w.manageResponse(reqPost, endpoint);
        let p = w.buildPromises(r);

        let v = function(apiResponses) {
            expect(apiResponses.length).to.be.equal(0);
            done();
        }

        let sendAPIResponse = sinon.stub(w, "sendAPIResponse").callsFake((apiResponses, res) => {
            v(apiResponses);
        });

        w.runPromises(reqPost, p , null);
    });

    it("runPromises should return unauthorized result", function(done) {
        let w = new WebServices.class(9090);

        w.registerAPI(new APIResgistrationClassA(
                                        new APIResponse.class(true, {"foo":"bar"})),
                                        WebServices.POST, ":/foo/bar/",
                                        Authentication.AUTH_USAGE_LEVEL
                                    );

        let r = w.manageResponse(reqPost, endpoint);

        r.addAuthenticationData(new AuthenticationData.class(true, "foo", Authentication.AUTH_NO_LEVEL));
        let p = w.buildPromises(r);

        let v = function(apiResponses) {
            expect(apiResponses.length).to.be.equal(1);
            expect(apiResponses[0].errorCode).to.be.equal(812);
            done();
        }

        let sendAPIResponse = sinon.stub(w, "sendAPIResponse").callsFake((apiResponses, res) => {
            v(apiResponses);
        });

        w.runPromises(reqPost, p , null);
    });

    /**
     * Send API response tests
     */
    it("sendAPIResponse should return a valid sample (test all processing, more functional)", function(done) {
        let w = new WebServices.class(9090);
        let sample = {foo:"bar"};

        w.register(new APIResgistrationClassA(null, false, true));
        w.register(new APIResgistrationClassB(new APIResponse.class(true, sample), true));

        let res = {};
        res.json = (d) => {
            expect(d).to.be.equal(sample);
            done();
        };

        let r = w.manageResponse(reqGet, endpoint);
        let p = w.buildPromises(r);
        w.runPromises(reqGet, p , res);
    });

    it("sendAPIResponse should return an error (test all processing, more functional)", function(done) {
        let w = new WebServices.class(9090);

        w.register(new APIResgistrationClassA(null, false, true));
        w.register(new APIResgistrationClassB(new APIResponse.class(false, {}, 100, "foo"), true));

        let res = {};
        res.status = (c) => {
            expect(c).to.be.equal(WebServices.API_ERROR_HTTP_CODE);

            let res2  = {};
            res2.json = (d) => {
                expect(d.code).to.be.equal(100);
                expect(d.message).to.be.equal("foo");
                done();
            };

            return res2;
        };


        let r = w.manageResponse(reqGet, endpoint);
        let p = w.buildPromises(r);
        w.runPromises(reqGet, p , res);
    });

    after(function () {

    });
});
