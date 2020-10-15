"use strict";
const Logger = require("./../../logger/Logger");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");
const DateUtils = require("./../../utils/DateUtils");
const SmartiesRunnerConstants = require("./../../../SmartiesRunnerConstants");

const GATEWAY_MODE = 1;
const GATEWAY_URL = "https://api.smarties.io/ping/";
// const GATEWAY_URL = "http://api.domain.net:8081/ping/";
const UI_URL = "https://me.smarties.io/";
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
     * @param  {string} version Smarties version
     * @param  {string} hash Smarties commit hash
     * @param  {TimeEventService} timeEventService Time event service
     * @param  {Object} appConfiguration App configuration
     * @param  {WebServices} webServices The web services
     * @param  {EventEmitter} eventBus    The global event bus
     * @param  {ScenarioManager} scenarioManager    The scenario manager
     * @param  {ThreadsManager} threadsManager    The threads manager
     * @param  {MessageManager} messageManager    The message manager
     * @param  {TranslateManager} translateManager    The translate manager
     * @param  {string} readyEvent    The ready event tag
     * @param  {string} installEvent    The install event tag
     *
     * @returns {GatewayManager} The instance
     */
    constructor(environmentManager, version, hash, timeEventService, appConfiguration, webServices, eventBus, scenarioManager, threadsManager, messageManager, translateManager, readyEvent, installEvent) {
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
        this.messageManager = messageManager;
        this.translateManager = translateManager;
        this.tunnelUrl = null;
        this.bootTimestamp = DateUtils.class.timestamp();
        this.bootMode = BOOT_MODE_BOOTING;
        this.customIdentifier = appConfiguration.customIdentifier;
        this.customIdentifierMessageSent = false;
        this.installationState = {};
        Logger.flog("+-----------------------+");
        Logger.flog("| Smarties ID : " + this.environmentManager.getSmartiesId() + " |");
        Logger.flog("+-----------------------+");
        Logger.flog("Your access : " + this.getDistantUrl());

        this.transmit();

        this.timeEventService.register((self) => {
            self.transmit();
        }, this, TimeEventService.EVERY_HOURS_INACCURATE);

        const self = this;

        this.eventBus.on(readyEvent, () => {
            setTimeout(() => {
                self.bootMode = BOOT_MODE_READY;
                self.transmit();
            }, 2000);
        });

        this.eventBus.on(SmartiesRunnerConstants.RESTART, () => {
            self.bootMode = BOOT_MODE_BOOTING;
            self.transmit();
        });

        this.eventBus.on(installEvent, (installationState) => {
            self.bootMode = BOOT_MODE_INSTALL;
            self.installationState = installationState;
            self.transmit();
        });

        // Alert scenario manager
        this.scenarioManager.setGatewayManager(this);
    }

    /**
     * Get full smarties URL
     *
     * @returns {string} The URL
     */
    getDistantUrl() {
        return UI_URL + this.environmentManager.getSmartiesId() + "/";
    }

    /**
     * Get full smarties API URL
     *
     * @returns {string} The URL
     */
    getDistantApiUrl() {
        return UI_URL + ((this.appConfiguration.customIdentifier && this.appConfiguration.customIdentifier.length > 0) ? this.appConfiguration.customIdentifier : this.environmentManager.getSmartiesId()) + this.webServices.getEndpointApi();
    }

    /**
     * Get full smarties API URL
     *
     * @returns {string} The URL
     */
    getBaseUrl() {
        return UI_URL;
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
            if (!error) {
                message({error:error, statusCode:res.statusCode, bootMode:data.bootInfos.bootMode});
            } else {
                message({error:error, statusCode:500, bootMode:data.bootInfos.bootMode});
            }
        });
    }

    /**
     * Transmit function sandbox callback
     *
     * @param  {Object} data Results
     * @param  {ThreadsManager} threadsManager The threads manager (can be used to call kill)
     * @param  {GatewayManager} context This instance
     */
    sandboxedRequestresponse(data, threadsManager, context) {
        if (data) {
            if (!data.error && data.statusCode === 200) {
                Logger.info("Registration to gateway OK (" + data.bootMode + ")");
            } else if (data.error) {
                Logger.err("An error occured while transmitting Gateway informations : " + data.error.errno);
            } else {
                if (data.statusCode === 527 && context && !context.customIdentifierMessageSent) {
                    context.messageManager.sendMessage("*", context.translateManager.t("gateway.manager.custom.identifier.already.taken", context.appConfiguration.customIdentifier));
                    context.appConfiguration.customIdentifier = null;
                    context.customIdentifierMessageSent = true;
                }
                Logger.err("Registration to gateway fails (" + data.statusCode + ")");
            }
        } else {
            Logger.err("No data for sandboxed request response");
        }

        try {
            threadsManager.kill("gateway-" + data.bootMode);
        } catch(e) {
            Logger.err(e.message + " gateway-" + data.bootMode);
        }
    }

    /**
     * Transmit informations to gateway
     */
    transmit() {
        if (!process.env.TEST) {
            Logger.info("Transmitting informations to gateway ...");
            const bootInfos = {
                smartiesId: this.environmentManager.getSmartiesId(),
                sslPort: (this.appConfiguration.ssl && this.appConfiguration.ssl.port)?this.appConfiguration.ssl.port:null,
                port: this.appConfiguration.port,
                version: this.version,
                hash: this.hash,
                localIp: this.environmentManager.getLocalIp(),
                tunnel: this.tunnelUrl,
                language:this.appConfiguration.lng,
                bootDate:this.bootTimestamp,
                bootMode:((this.bootMode === BOOT_MODE_READY && !this.tunnelUrl) ? BOOT_MODE_BOOTING : this.bootMode),
                installationState: this.installationState,
                customIdentifier: this.customIdentifier,
                timestamp: DateUtils.class.timestampMs(),
                gatewayMode: GATEWAY_MODE
            };
            Logger.info("Informations : " + JSON.stringify(bootInfos));

            // Call on separate process
            this.threadsManager.run(this.sandboxedRequest, "gateway-" + this.bootMode, {GATEWAY_URL:GATEWAY_URL, bootInfos:bootInfos}, this.sandboxedRequestresponse, this);
        }
    }
}

module.exports = {class:GatewayManager, BOOT_MODE_BOOTING:BOOT_MODE_BOOTING, BOOT_MODE_INSTALL:BOOT_MODE_INSTALL, BOOT_MODE_READY:BOOT_MODE_READY};
