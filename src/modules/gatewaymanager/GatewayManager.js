"use strict";
const Logger = require("./../../logger/Logger");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");
const DateUtils = require("./../../utils/DateUtils");
const HautomationRunnerConstants = require("./../../../HautomationRunnerConstants");
const WebServices = require("./../../services/webservices/WebServices");

const GATEWAY_MODE = 1;
const GATEWAY_URL = "https://api.hautomation-io.com/ping/";
// const GATEWAY_URL = "http://api.domain.net:8081/ping/";
const UI_URL = "https://me.hautomation-io.com/";
const BOOT_MODE_BOOTING = "BOOTING";
const BOOT_MODE_INSTALL = "INSTALL";
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
     * @param  {ScenarioManager} scenarioManager    The scenario manager
     * @param  {ThreadsManager} threadsManager    The threads manager
     * @param  {string} readyEvent    The ready event tag
     * @param  {string} installEvent    The install event tag
     *
     * @returns {GatewayManager} The instance
     */
    constructor(environmentManager, version, hash, timeEventService, appConfiguration, webServices, eventBus, scenarioManager, threadsManager, readyEvent, installEvent) {
        this.environmentManager = environmentManager;
        this.version = version;
        this.hash = hash;
        this.timeEventService = timeEventService;
        this.appConfiguration = appConfiguration;
        this.webServices = webServices;
        this.webServices.gatewayManager = this;
        this.eventBus = eventBus;
        this.scenarioManager = scenarioManager;
        this.threadsManager = threadsManager;
        this.tunnelUrl = null;
        this.bootTimestamp = DateUtils.class.timestamp();
        this.bootMode = BOOT_MODE_BOOTING;
        Logger.flog("+-----------------------+");
        Logger.flog("| Hautomation ID : " + this.environmentManager.getHautomationId() + " |");
        Logger.flog("+-----------------------+");
        Logger.flog("Your access : " + this.getDistantUrl());

        this.transmit();

        this.timeEventService.register((self) => {
            self.transmit();
        }, this, TimeEventService.EVERY_DAYS);

        const self = this;

        this.eventBus.on(readyEvent, () => {
            setTimeout(() => {
                self.bootMode = BOOT_MODE_READY;
                self.transmit();
            }, 2000);
        });

        this.eventBus.on(HautomationRunnerConstants.RESTART, () => {
            self.bootMode = BOOT_MODE_BOOTING;
            self.transmit();
        });

        this.eventBus.on(installEvent, () => {
            self.bootMode = BOOT_MODE_INSTALL;
            self.transmit();
        });

        // Alert scenario manager
        this.scenarioManager.setGatewayManager(this);
    }

    /**
     * Get full hautomation URL
     *
     * @returns {string} The URL
     */
    getDistantUrl() {
        return UI_URL + this.environmentManager.getHautomationId() + "/";
    }

    /**
     * Get full hautomation API URL
     *
     * @returns {string} The URL
     */
    getDistantApiUrl() {
        return UI_URL + this.environmentManager.getHautomationId() + WebServices.ENDPOINT_API;
    }


    /**
     * Transmit function threaded methods (threads manager)
     *
     * @param  {Object} data    The needs
     * @param  {Function} message Called to send back answer
     */
    sandboxedRequest(data, message) {
        const request = require("request");
        request.post(data.GATEWAY_URL, {
            json: data.bootInfos
        }, (error, res) => {
            message({error:error, statusCode:res.statusCode, bootMode:data.bootInfos.bootMode});
        });
    }

    /**
     * Transmit function sandbox callback
     *
     * @param  {Object} data Results
     * @param  {ThreadsManager} threadsManager The threads manager (can be used to call kill)
     */
    sandboxedRequestresponse(data, threadsManager) {
        if (!data.error && data.statusCode === 200) {
            Logger.info("Registration to gateway OK (" + data.bootMode + ")");
        } else if (data.error) {
            Logger.err(data.error.message);
        } else {
            Logger.err("Registration to gateway fails (" + data.statusCode + ")");
        }

        try {
            threadsManager.kill("gateway-" + data.bootMode);
        } catch(e) {
            Logger.err(e.message);
        }
    }

    /**
     * Transmit informations to gateway
     */
    transmit() {
        if (!process.env.TEST) {
            Logger.info("Transmitting informations to gateway ...");

            const bootInfos = {
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
            };
            // Call on separate process
            this.threadsManager.run(this.sandboxedRequest, "gateway-" + this.bootMode, {GATEWAY_URL:GATEWAY_URL, bootInfos:bootInfos}, this.sandboxedRequestresponse);
        }
    }
}

module.exports = {class:GatewayManager};
