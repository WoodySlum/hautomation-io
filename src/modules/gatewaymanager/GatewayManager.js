"use strict";
const Logger = require("./../../logger/Logger");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");
const sha256 = require("sha256");
const request = require("request");
const GATEWAY_MODE = 1;
const GATEWAY_URL = "https://www.hautomation.net/services/";

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
     * @param  {TimeEventService} timeEventService Time event service
     * @param  {Object} appConfiguration App configuration
     *
     * @returns {GatewayManager} The instance
     */
    constructor(environmentManager, version, timeEventService, appConfiguration) {
        this.environmentManager = environmentManager;
        this.version = version;
        this.timeEventService = timeEventService;
        this.appConfiguration = appConfiguration;
        Logger.info("Hautomation ID : " + this.getHautomationId());
        this.transmit();

        this.timeEventService.register((self) => {
            self.transmit();
        }, this, TimeEventService.EVERY_DAYS);
    }

    /**
     * Returns the hautomation ID
     *
     * @returns {string} Hautomation identifier
     */
    getHautomationId() {
        const macAddress = this.environmentManager.getMacAddress();
        if (macAddress) {
            return sha256(macAddress).substr(0,4);
        }

        return macAddress;
    }

    /**
     * Transmit informations to gateway
     */
    transmit() {
        const headers = {
            "User-Agent":       "Hautomation/" + this.version,
            "Content-Type":     "application/x-www-form-urlencoded"
        };

        // Configure the request
        const options = {
            url: GATEWAY_URL,
            port: 443,
            method: "POST",
            headers: headers,
            form: {
                hautomationId: this.getHautomationId(),
                port: (this.appConfiguration.ssl && this.appConfiguration.ssl.port)?this.appConfiguration.ssl.port:this.appConfiguration.port,
                method: "register",
                version: 0,
                localIp: this.environmentManager.getLocalIp(),
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
