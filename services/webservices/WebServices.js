"use strict";
var Logger = require('./../../logger/Logger');
var Service = require('./../Service').Service;
var ServiceConst = require('./../Service');

class WebServices extends Service {

    constructor(port = 8080) {
        super();
        this.port = port;
        let express = require('express');
        this.app = express();
        this.server = null;
    }

    start() {
        if (this.status != ServiceConst.RUNNING) {
            this.app.get('/services/', function(req, res) {
                res.send('Hello\n');
            });
            
            this.server = this.app.listen(this.port);
            Logger.info("Web services are listening on port " + this.port);

            super.start();
        } else {
            Logger.warn("Web services are already running");
        }
    }

    stop() {
        if (this.server && this.status == ServiceConst.RUNNING) {
            this.server.close();
        } else {
            Logger.warn("WebServices are not running, nothing to do...");
        }
    }
}

module.exports = WebServices;
