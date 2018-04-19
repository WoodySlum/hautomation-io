"use strict";
const Logger = require("./../../logger/Logger");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");
const request = require("request");
const GATEWAY_MODE = 1;
const GATEWAY_URL = "https://api.hautomation-io.com/ping/";
// const GATEWAY_URL = "http://api.domain.net:8081/ping/";

/**
 * This class manage gateway communications
 * @class
 */
class GatewayManager {
    /**
     * Constructor
     *
     * @param  {EnvironmentManager} environmentManager The environment manager
     * @param  {string} version Hautomation version
     * @param  {string} hash Hautomation commit hash
     * @param  {TimeEventService} timeEventService Time event service
     * @param  {Object} appConfiguration App configuration
     * @param  {WebServices} webServices The web services
     *
     * @returns {GatewayManager} The instance
     */
    constructor(environmentManager, version, hash, timeEventService, appConfiguration, webServices) {
        this.environmentManager = environmentManager;
        this.version = version;
        this.hash = hash;
        this.timeEventService = timeEventService;
        this.appConfiguration = appConfiguration;
        this.webServices = webServices;
        this.webServices.gatewayManager = this;
        this.tunnelUrl = null;
        Logger.info("Hautomation ID : " + this.environmentManager.getHautomationId());

        this.timeEventService.register((self) => {
            self.transmit();
        }, this, TimeEventService.EVERY_DAYS);
    }

    /**
     * Transmit informations to gateway
     */
    transmit() {
        const headers = {
            "User-Agent":       "Hautomation/" + this.version,
            "Content-Type":     "application/json"
        };

        // Configure the request
        const options = {
            url: GATEWAY_URL,
            port: 443,
            method: "POST",
            headers: headers,
            json: {
                hautomationId: this.environmentManager.getHautomationId(),
                sslPort: (this.appConfiguration.ssl && this.appConfiguration.ssl.port)?this.appConfiguration.ssl.port:null,
                port: this.appConfiguration.port,
                version: this.version,
                hash: this.hash,
                localIp: this.environmentManager.getLocalIp(),
                tunnel: this.tunnelUrl,
                language:this.appConfiguration.lng,
                gatewayMode: GATEWAY_MODE
            }
        };

        // Start the request
        request(options, function (error, response) {
            if (!error && response.statusCode == 200) {
                Logger.info("Registration to gateway OK");
            }
            if (error) {
                Logger.err(error.message);
            }
        });
    }
}

module.exports = {class:GatewayManager};
