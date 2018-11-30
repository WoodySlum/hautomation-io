"use strict";
const XMLHttpRequest = require("xmlhttprequest-ssl").XMLHttpRequest;
const Logger = require("./../../logger/Logger");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");
const DateUtils = require("./../../utils/DateUtils");
const HautomationRunnerConstants = require("./../../../HautomationRunnerConstants");

const GATEWAY_MODE = 1;
// const GATEWAY_URL = "https://api.hautomation-io.com/ping/";
const UI_URL = "https://me.hautomation-io.com/";
const GATEWAY_TIMEOUT = 5000;
const GATEWAY_URL = "http://api.domain.net:8081/ping/";
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
        Logger.flog("+-----------------------+");
        Logger.flog("| Hautomation ID : " + this.environmentManager.getHautomationId() + " |");
        Logger.flog("+-----------------------+");
        Logger.flog("Your access : " + UI_URL + this.environmentManager.getHautomationId() + "/");

        this.transmit();

        this.timeEventService.register((self) => {
            self.transmit();
        }, this, TimeEventService.EVERY_DAYS);

        const self = this;

        this.eventBus.on(readyEvent, () => {
            self.bootMode = BOOT_MODE_READY;
            self.transmit();
        });

        this.eventBus.on(HautomationRunnerConstants.RESTART, () => {
            self.bootMode = BOOT_MODE_BOOTING;
            self.transmit();
            self.restart(self);
        });
    }

    /**
     * Transmit informations to gateway
     *
     * @param  {boolean} [asyncr=true] `true` if request should be asynchronously done, `false` otherwise (must be specified)
     */
    transmit(asyncr = true) {
        if (!process.env.TEST) {
            const xhr = new XMLHttpRequest();
            let running = true;
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
                bootMode:(this.tunnelUrl ? this.bootMode : BOOT_MODE_BOOTING),
                gatewayMode: GATEWAY_MODE
            };
            Logger.verbose(bootInfos);

            xhr.open("POST", GATEWAY_URL, asyncr);
            xhr.setRequestHeader("User-Agent", "Hautomation/" + this.version);
            xhr.setRequestHeader("Content-Type", "application/json");

            if (asyncr) {
                xhr.onload = () => {
                    if (parseInt(xhr.readyState) === 4) {
                        running = false;
                        if (parseInt(xhr.status) === 200) {
                            Logger.info("Registration to gateway OK (" + bootInfos.bootMode + ")");
                        } else {
                            Logger.err(xhr.statusText);
                        }
                    }
                };
            }

            xhr.onerror = (err) => {
                running = false;
                Logger.err(err.message);
            };

            setTimeout(() => {
                if (running) {
                    xhr.abort();
                }
            }, GATEWAY_TIMEOUT);

            xhr.send(JSON.stringify(bootInfos));

            if (!asyncr) {
                if (parseInt(xhr.readyState) === 4) {
                    running = false;
                    if (parseInt(xhr.status) === 200) {
                        Logger.info("Registration to gateway OK (" + bootInfos.bootMode + ")");
                    } else {
                        Logger.err(xhr.statusText);
                    }
                }
            }
        }
    }
}

module.exports = {class:GatewayManager};
