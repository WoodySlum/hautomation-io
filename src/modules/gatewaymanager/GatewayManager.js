"use strict";
const Logger = require("./../../logger/Logger");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");
const request = require("request");
const SyncRequest = require("sync-request");
const DateUtils = require("./../../utils/DateUtils");

const GATEWAY_MODE = 1;
const GATEWAY_URL = "https://api.hautomation-io.com/ping/";
// const GATEWAY_URL = "http://api.domain.net:8081/ping/";
const BOOT_MODE_BOOTING = "BOOTING";
const BOOT_MODE_READY = "READY";

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
     * @param  {EventEmitter} eventBus    The global event bus
     * @param  {string} readyEvent    The ready event tag
     *
     * @returns {GatewayManager} The instance
     */
    constructor(environmentManager, version, hash, timeEventService, appConfiguration, webServices, eventBus, readyEvent) {
        this.environmentManager = environmentManager;
        this.version = version;
        this.hash = hash;
        this.timeEventService = timeEventService;
        this.appConfiguration = appConfiguration;
        this.webServices = webServices;
        this.webServices.gatewayManager = this;
        this.eventBus = eventBus;
        this.tunnelUrl = null;
        this.bootTimestamp = DateUtils.class.timestamp();
        this.bootMode = BOOT_MODE_BOOTING;
        Logger.info("Hautomation ID : " + this.environmentManager.getHautomationId());

        if (!process.env.TEST) {
            this.transmit(true);

            this.timeEventService.register((self) => {
                self.transmit();
            }, this, TimeEventService.EVERY_DAYS);

            const self = this;

            this.eventBus.on(readyEvent, () => {
                self.bootMode = BOOT_MODE_READY;
                self.transmit();
            });
        }
    }

    /**
     * Transmit informations to gateway
     *
     * @param  {boolean} [sync=false] `true` if call should be synchronous
     */
    transmit(sync = false) {
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
                bootDate:this.bootTimestamp,
                bootMode:this.bootMode,
                gatewayMode: GATEWAY_MODE
            }
        };

        if (sync) {
            SyncRequest("POST", GATEWAY_URL, options);
            Logger.info("Registration to gateway OK");
        } else {
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
}

module.exports = {class:GatewayManager};
