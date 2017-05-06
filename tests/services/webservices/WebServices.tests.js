/* eslint-env node, mocha */
var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");

var WebServices = require("./../../../services/webservices/WebServices");
var APIResponse = require("./../../../services/webservices/APIResponse");

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

    it("constructor should be well played", function() {
        let w = new WebServices.class(9090);
        expect(w).to.have.property("port").and.equal(9090);
        expect(w).to.have.property("app").and.to.be.not.null;
        expect(w).to.have.property("server").and.to.be.null;
    });

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

    it("runPromises should go well with 2 success", function(done) {
        let w = new WebServices.class(9090);
        w.register({
            processAPI : function(apiRequest) {
                return new Promise((resolve, reject) => {
                    resolve(new APIResponse.class(true, {"foo":"bar"}));
                 } );
            }
        });

        w.register({
            processAPI : function(apiRequest) {
                return new Promise((resolve, reject) => {
                    resolve(new APIResponse.class(true, {"foo":"bar"}));
                 } );
            }
        });

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

    it("runPromises should go get only one APIResult with first promise in error", function(done) {
        let w = new WebServices.class(9090);
        w.register({
            processAPI : function(apiRequest) {
                return new Promise((resolve, reject) => {
                    reject(new APIResponse.class(false, {"foo":"bar"}));
                 } );
            }
        });

        w.register({
            processAPI : function(apiRequest) {
                return new Promise((resolve, reject) => {
                    resolve(new APIResponse.class(true, {"foo":"bar"}));
                 } );
            }
        });

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
        w.register({
            processAPI : function(apiRequest) {
                return new Promise((resolve, reject) => {
                    resolve(new APIResponse.class(true, {"foo":"bar"}));
                 } );
            }
        });

        w.register({
            processAPI : function(apiRequest) {
                return new Promise((resolve, reject) => {
                    reject(new APIResponse.class(false, {"foo":"bar"}, 100, "foo"));
                 } );
            }
        });

        let r = w.manageResponse(reqPost, endpoint);
        let p = w.buildPromises(r);

        let v = function(apiResponses) {
            console.log(JSON.stringify(apiResponses));
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
        w.register({
            processAPI : function(apiRequest) {
                return new Promise((resolve, reject) => {
                    resolve();
                 } );
            }
        });

        w.register({
            processAPI : function(apiRequest) {
                return new Promise((resolve, reject) => {
                    resolve(new APIResponse.class(true, {"foo":"bar"}));
                 } );
            }
        });

        let r = w.manageResponse(reqPost, endpoint);
        let p = w.buildPromises(r);

        let v = function(apiResponses) {
            expect(apiResponses.length).to.be.equal(2);
            expect(apiResponses[0]).to.be.undefined;
            expect(apiResponses[1].success).to.be.true;
            done();
        }

        let sendAPIResponse = sinon.stub(w, "sendAPIResponse").callsFake((apiResponses, res) => {
            v(apiResponses);
        });

        w.runPromises(reqPost, p , null);
    });

    it("sendAPIResponse should return a valid sample (test all processing, more functional)", function(done) {
        let w = new WebServices.class(9090);
        let sample = {foo:"bar"};
        w.register({
            processAPI : function(apiRequest) {
                return new Promise((resolve, reject) => {
                    resolve();
                 } );
            }
        });

        w.register({
            processAPI : function(apiRequest) {
                return new Promise((resolve, reject) => {
                    resolve(new APIResponse.class(true, sample));
                 } );
            }
        });
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

        w.register({
            processAPI : function(apiRequest) {
                return new Promise((resolve, reject) => {
                    resolve(new APIResponse.class(true, {}));
                 } );
            }
        });

        w.register({
            processAPI : function(apiRequest) {
                return new Promise((resolve, reject) => {
                    reject(new APIResponse.class(false, {}, 100, "foo"));
                 } );
            }
        });
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
