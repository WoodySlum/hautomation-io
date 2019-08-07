"use strict";
const sha256 = require("sha256");
const os = require("os");
const fs = require("fs-extra");
const https = require("https");
const timezone = require("node-google-timezone");
const { MacScanner } = require("mac-scanner");
const dns = require("dns");
const childProcess = require("child_process");
const machineId = require("node-machine-id");
const Logger = require("./../../logger/Logger");
const FormConfiguration = require("./../formconfiguration/FormConfiguration");
const EnvironmentForm = require("./EnvironmentForm");
const Tile = require("./../dashboardmanager/Tile");
const Icons = require("./../../utils/Icons");
const DayNightScenarioForm = require("./DayNightScenarioForm");
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");
const HautomationRunnerConstants = require("./../../../HautomationRunnerConstants");
const IpScanForm = require("./IpScanForm");
const DateUtils = require("../../utils/DateUtils");
const ROUTE_APP_ENVIRONMENT_INFORMATION = "/environment/app/get/";
const ROUTE_APP_SET_CONFIGURATION = "/environment/conf/set/";
const ROUTE_APP_GET_CONFIGURATION = "/environment/conf/get/";
const MAIN_CONFIG_PATH = "./data/config.json";
const DEBIAN_REPOSITORY = "https://deb.hautomation-io.com/";
const DEBIAN_REPOSITORY_LAST_VERSION = "dists/trusty/main/binary-armhf/Packages";
const EVENT_SCAN_IP_CHANGES = "scan-ip-change";
const EVENT_SCAN_IP_UPDATE = "scan-ip-update";
const UPTIME_FILE = ".uptime";
const EVENT_POWER_OUTAGE = "power-outage";
const POWER_OUTAGE_DELAY = 10 * 1000;

/**
 * This class allows to manage house environment
 * @class
 */
class EnvironmentManager {
    /**
     * Constructor
     *
     * @param  {AppConfiguration} appConfiguration The app configuration object
     * @param  {ConfManager} confManager  A configuration manager
     * @param  {FormManager} formManager  A form manager
     * @param  {WebServices} webServices  The web services
     * @param  {DashboardManager} dashboardManager The dashboard manager
     * @param  {TranslateManager} translateManager    The translate manager
     * @param  {ScenarioManager} scenarioManager    The scenario manager
     * @param  {string} version    The app version
     * @param  {string} hash    The app hash
     * @param  {InstallationManager} installationManager    The installation manager
     * @param  {TimeEventService} timeEventService    The time event service
     * @param  {EventEmitter} eventBus    The global event bus
     * @param  {MessageManager} messageManager    The message manager
     * @param  {string} eventStop    The stop event (broadcast identifier)
     * @param  {string} eventReady    The ready event (broadcast identifier)
     * @param  {UserManager} userManager    The user manager
     *
     * @returns {EnvironmentManager}              The instance
     */
    constructor(appConfiguration, confManager, formManager, webServices, dashboardManager, translateManager, scenarioManager, version, hash, installationManager, timeEventService, eventBus, messageManager, eventStop, eventReady, userManager) {
        this.appConfiguration = appConfiguration;
        this.formConfiguration = new FormConfiguration.class(confManager, formManager, webServices, "environment", false, EnvironmentForm.class);
        this.dashboardManager = dashboardManager;
        this.formManager = formManager;
        this.translateManager = translateManager;
        this.scenarioManager = scenarioManager;
        this.eventBus = eventBus;
        this.formConfiguration.data = this.formConfiguration.data?this.formConfiguration.data:{};
        this.registeredElements = {};
        this.registerTile();
        this.formManager.register(DayNightScenarioForm.class);
        this.scenarioManager.register(DayNightScenarioForm.class, null, "daynight.scenario.trigger.title", 200);
        this.version = version;
        this.hash = hash;
        this.installationManager = installationManager;
        this.timeEventService = timeEventService;
        this.messageManager = messageManager;
        this.eventStop = eventStop;
        this.eventReady = eventReady;
        this.userManager = userManager;
        this.userManager.environmentManager = this;
        this.scannedIps = [];
        this.manageUptimeFile();
        webServices.registerAPI(this, WebServices.GET, ":" + ROUTE_APP_ENVIRONMENT_INFORMATION, Authentication.AUTH_USAGE_LEVEL);
        webServices.registerAPI(this, WebServices.POST, ":" + ROUTE_APP_SET_CONFIGURATION, Authentication.AUTH_ADMIN_LEVEL);
        webServices.registerAPI(this, WebServices.GET, ":" + ROUTE_APP_GET_CONFIGURATION, Authentication.AUTH_ADMIN_LEVEL);
        this.registerIpScanForm();

        if (!process.env.TEST) {
            this.timeEventService.register((self) => {
                self.updateCore();
            }, this, TimeEventService.EVERY_DAYS);
            this.updateCore();
        }

        // Set timezone
        if (!process.env.TEST) {
            this.setTimezone(this.appConfiguration);
        }

        this.startIpScan();
    }

    /**
     * Set timezone
     *
     * @param {Object} appConfiguration An app configuration
     */
    setTimezone(appConfiguration) {
        // Set synchronously timezone
        if (appConfiguration && appConfiguration.home && appConfiguration.home.timezone) {
            Logger.info("No time zone API can be called. Applying previous : " + appConfiguration.home.timezone);
            process.env.TZ = appConfiguration.home.timezone;
        }

        if (appConfiguration && appConfiguration.home && appConfiguration.home.longitude && appConfiguration.home.latitude) {
            timezone.data(appConfiguration.home.latitude, appConfiguration.home.longitude, 0, (err, tz) => {
                if (!err && tz && tz.raw_response && tz.raw_response.timeZoneId) {
                    Logger.info("Writing main configuration data");
                    appConfiguration.home.timezone = tz.raw_response.timeZoneId;
                    Logger.info("Time zone detected : " + appConfiguration.home.timezone);
                    process.env.TZ = appConfiguration.home.timezone;
                    fs.writeFileSync(MAIN_CONFIG_PATH, JSON.stringify(appConfiguration, null, "    "));
                } else if (appConfiguration.home.timezone) {
                    if (err) {
                        Logger.err(err.message);
                    }
                    Logger.info("No time zone API response. Applying previous : " + appConfiguration.home.timezone);
                    process.env.TZ = appConfiguration.home.timezone;
                }
            });
        } else {
            Logger.err("Could not set timezone. Empty home location params");
        }
    }

    /**
     * Register for day/night notifications
     *
     * @param  {Function} cb            A callback triggered when day/night information is received. Example : `(isNight) => {}`
     * @param  {string} id            An identifier
     */
    registerDayNightNotifications(cb, id = null) {
        const index = sha256(cb.toString() + id);
        this.registeredElements[index] = cb;
    }

    /**
     * Unegister for day/night notifications
     *
     * @param  {Function} cb             A callback triggered when day/night information is received. Example : `(isNight) => {}`
     * @param  {string} id            An identifier
     */
    unregisterDayNightNotifications(cb, id = null) {
        const index = sha256(cb.toString() + id);
        if (this.registeredElements[index]) {
            delete this.registeredElements[index];
        } else {
            Logger.warn("Element not found");
        }
    }

    /**
     * Register day / night tile
     */
    registerTile() {
        let tileTitle = this.translateManager.t("environment.day");
        let icon = "sun-1";
        if (this.isNight()) {
            tileTitle = this.translateManager.t("environment.night");
            icon = "moon";
        }
        const tile = new Tile.class(this.dashboardManager.themeManager, "day-night", Tile.TILE_INFO_ONE_TEXT, Icons.class.list()[icon], null, tileTitle, null, null, null, null, 200);
        this.dashboardManager.registerTile(tile);
    }

    /**
     * Return the home's coordinates
     *
     * @returns {Object} The coordinates
     */
    getCoordinates() {
        return this.appConfiguration.home;
    }

    /**
     * Dispatch day or night changes
     */
    dispatchDayNightChange() {
        // Dispatch callback
        Object.keys(this.registeredElements).forEach((registeredKey) => {
            this.registeredElements[registeredKey](this.isNight());
        });

        // Dispatch to scenarios
        this.scenarioManager.getScenarios().forEach((scenario) => {
            if (scenario.DayNightScenarioForm && scenario.DayNightScenarioForm.day && !this.isNight()) {
                this.scenarioManager.triggerScenario(scenario);
            }

            if (scenario.DayNightScenarioForm && scenario.DayNightScenarioForm.night && this.isNight()) {
                this.scenarioManager.triggerScenario(scenario);
            }
        });
    }

    /**
     * Set day
     */
    setDay() {
        if (this.isNight()) {
            Logger.info("Day mode enabled");
            this.formConfiguration.data.day = true;
            this.formConfiguration.save();
            this.registerTile();

            this.dispatchDayNightChange();
        }
    }

    /**
     * Set night
     */
    setNight() {
        if (!this.isNight()) {
            Logger.info("Night mode enabled");
            this.formConfiguration.data.day = false;
            this.formConfiguration.save();
            this.registerTile();

            this.dispatchDayNightChange();
        }
    }

    /**
     * Is it night ?
     *
     * @returns {boolean} `true` if night mode, otherwise `false`
     */
    isNight() {
        return !this.formConfiguration.data.day;
    }

    /**
     * Get the local HTTP port
     *
     * @returns {number} The local hautomation HTTP port
     */
    getLocalPort() {
        return this.appConfiguration.port;
    }

    /**
     * Get the local IP address, null if not found
     *
     * @returns {string} The local IP address
     */
    getLocalIp() {
        const ifaces = os.networkInterfaces();
        let localIp = null;
        Object.keys(ifaces).forEach(function (ifname) {
            ifaces[ifname].forEach(function (iface) {
                if ("IPv4" !== iface.family || iface.internal !== false) {
                    // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                    return;
                }

                localIp = iface.address;
            });
        });

        return localIp;
    }

    /**
     * Get the mac address
     *
     * @returns {string} The mac address, or `null` if not found
     */
    getMacAddress() {
        const ifaces = os.networkInterfaces();
        let macAddress = null;
        Object.keys(ifaces).forEach(function (ifname) {

            ifaces[ifname].forEach(function (iface) {
                if ("IPv4" !== iface.family || iface.internal !== false) {
                    // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                    return;
                }

                macAddress = iface.mac;
            });
        });

        return macAddress;
    }

    /**
     * Get the local API Url
     *
     * @returns {string} The local API url (e.g. : http://192.168.2.34:8100/api/)
     */
    getLocalAPIUrl() {
        return "http://" + this.getLocalIp() + ":" + this.getLocalPort() + WebServices.ENDPOINT_API;
    }

    /**
     * Save the main configuration. This method throw an error if something wrong occurs.
     *
     * @param  {Object} data The configuration data to be updated
     */
    saveMainConfiguration(data) {
        const mainConfiguration = this.appConfiguration;
        // Custom identifier part
        if (data.customIdentifier && data.customIdentifier.length > 0) {
            mainConfiguration.customIdentifier = data.customIdentifier.trim().toLowerCase();
        } else {
            mainConfiguration.customIdentifier = null;
        }

        // Admin part
        if (data.admin) {
            if (data.admin.username) {
                mainConfiguration.admin.username = data.admin.username;
            }

            if (data.admin.password) {
                if (data.admin.password.length >= 8) {
                    mainConfiguration.admin.password = data.admin.password;
                } else {
                    throw Error("Admin password is too short (8 characters minimum)");
                }
            }
        }

        // Cameras part
        if (data.cameras) {
            mainConfiguration.cameras.history = data.cameras.history;
            mainConfiguration.cameras.season = data.cameras.season;
            mainConfiguration.cameras.timelapse = data.cameras.timelapse;
        }

        // Lng part
        if (data.lng) {
            if (data.lng.length === 2) {
                mainConfiguration.lng = data.lng;
            } else {
                throw Error("Invalid language");
            }
        }

        // Home part
        if (data.home) {
            if (data.home.longitude) {
                mainConfiguration.home.longitude = parseFloat(data.home.longitude);
            } else {
                throw Error("Missing home longitude");
            }

            if (data.home.latitude) {
                mainConfiguration.home.latitude = parseFloat(data.home.latitude);
            } else {
                throw Error("Missing home latitude");
            }

            if (data.home.radius) {
                mainConfiguration.home.radius = parseFloat(data.home.radius);
            } else {
                throw Error("Missing home radius");
            }
        }

        // Bot part
        if (data.bot) {
            if (typeof data.bot.enable === "boolean") {
                mainConfiguration.bot.enable = data.bot.enable;
            }

            if (data.bot.sensitivity) {
                mainConfiguration.bot.sensitivity = parseFloat(data.bot.sensitivity);
            } else {
                throw Error("Missing bot sensitivity");
            }

            if (data.bot.audioGain) {
                mainConfiguration.bot.audioGain = parseFloat(data.bot.audioGain);
            } else {
                throw Error("Missing bot audio gain");
            }

            if (data.bot.outputVolume) {
                mainConfiguration.bot.outputVolume = parseFloat(data.bot.outputVolume);
            } else {
                throw Error("Missing bot output volume");
            }
        }

        // Debbugging part
        if (Number.isInteger(data.logLevel)) {
            mainConfiguration.logLevel = parseInt(data.logLevel);
        }

        if (typeof data.crashOnPluginError === "boolean") {
            mainConfiguration.crashOnPluginError = Boolean(data.crashOnPluginError);
        }

        mainConfiguration.defaultConfig = false;

        Logger.info("Writing main configuration data");
        fs.writeFileSync(MAIN_CONFIG_PATH, JSON.stringify(mainConfiguration, null, "    "));

        // Restart
        setTimeout((self) => {
            self.eventBus.emit(HautomationRunnerConstants.RESTART);
        }, 2000, this);
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        if (apiRequest.route.startsWith( ":" + ROUTE_APP_ENVIRONMENT_INFORMATION)) {
            return new Promise((resolve) => {
                resolve(new APIResponse.class(true, {version:this.version, hash:this.hash, hautomationId: this.getHautomationId(), customIdentifier:this.appConfiguration.customIdentifier}));
            });
        } else if (apiRequest.route === ":" + ROUTE_APP_SET_CONFIGURATION) {
            return new Promise((resolve, reject) => {
                try {
                    this.saveMainConfiguration(apiRequest.data);
                    resolve(new APIResponse.class(true, {successs: true}));
                } catch(e) {
                    reject(new APIResponse.class(false, {}, 4512, e.message));
                }
            });
        } else if (apiRequest.route === ":" + ROUTE_APP_GET_CONFIGURATION) {
            return new Promise((resolve) => {
                resolve(new APIResponse.class(true, this.appConfiguration));
            });
        }
    }

    /**
     * Try to update core
     */
    updateCore() {
        // For apt linux
        if (os.platform() === "linux") {
            Logger.info("Trying au update core");
            https.get(DEBIAN_REPOSITORY + DEBIAN_REPOSITORY_LAST_VERSION, (response) => {
                let body = "";
                response.on("data", (d) => {
                    body += d;
                });
                response.on("end", () => {
                    if (response.statusCode === 200 && body.length > 0) {
                        const versionRegex = /Version: ([0-9.]+)/gm;
                        const rRegex = versionRegex.exec(body);
                        const hashRegex = /SHA256: ([0-9a-z]+)/gm;
                        const rhashRegex = hashRegex.exec(body);
                        const fileRegex = /Filename: ([a-zA-Z/\-._0-9]+)/gm;
                        const rfileRegex = fileRegex.exec(body);

                        if (rRegex && rRegex.length > 1 && rhashRegex && rhashRegex.length > 1 && rfileRegex && rfileRegex.length > 1) {
                            const version = rRegex[1];
                            // Compare version
                            const splitCurrentVersion = this.version.split(".");
                            const splitNewVersion = version.split(".");
                            if (splitCurrentVersion.length === 3 && splitNewVersion.length === 3) {
                                const currentVersion = 100000 * parseInt(splitCurrentVersion[0]) + 1000 * parseInt(splitCurrentVersion[1]) + 1 * parseInt(splitCurrentVersion[2]);
                                const serverVersion = 100000 * parseInt(splitNewVersion[0]) + 1000 * parseInt(splitNewVersion[1]) + 1 * parseInt(splitNewVersion[2]);
                                if (serverVersion > currentVersion) {
                                    Logger.info("Core update available");
                                    this.messageManager.sendMessage("*", this.translateManager.t("core.update.available", version));
                                    const updateScript = this.appConfiguration.cachePath + "core-update-" + version + ".sh";
                                    
                                    if (fs.existsSync(updateScript)) {
                                        fs.unlinkSync(updateScript);
                                    }
                                    fs.writeFileSync(updateScript, "sudo service hautomation stop\nsleep 2\nsudo apt-get update\nsudo apt-get install -y --allow-unauthenticated hautomation\nsleep 2\nsudo service hautomation start");
                                    fs.chmodSync(updateScript, 0o555);
                                    childProcess.spawn("nohup", ["sh", "-c", "'" + updateScript + "'", "&"], {
                                        detached: true,
                                        stdio: [ "ignore", "ignore", "ignore" ]
                                    }.unref());
                                } else {
                                    Logger.info("No core update available");
                                }
                            } else {
                                Logger.err("Error in version calculation");
                            }
                        } else {
                            Logger.err("Could not find version on deb repo");
                        }
                    } else {
                        Logger.err("Could not contact deb repo : HTTP error " + response.statusCode);
                    }
                });
            });
        }
    }

    /**
     * Check if this is the default configuration exposed
     *
     * @returns {boolean} `true` if this is the default config, `false` otherwise
     */
    isDefaultConfig() {
        return this.appConfiguration.defaultConfig;
    }

    /**
     * Returns the hautomation ID
     *
     * @returns {string} Hautomation identifier
     */
    getHautomationId() {
        return machineId.machineIdSync().substr(0,4);
    }

    /**
     * Returns the full hautomation ID
     *
     * @returns {string} Hautomation full identifier
     */
    getFullHautomationId() {
        return machineId.machineIdSync();
    }

    /**
     * Register ip scan form
     */
    registerIpScanForm() {
        const values = [];
        const valuesWithoutFreetext = [];
        const labels = [];
        this.scannedIps.forEach((scannedIp) => {
            values.push(scannedIp.ip);
            valuesWithoutFreetext.push(scannedIp.ip);
            if (scannedIp.name) {
                labels.push(scannedIp.name + " [" + scannedIp.ip + "]");
            } else {
                labels.push(scannedIp.mac + " [" + scannedIp.ip + "]");
            }

        });
        values.push("freetext");
        labels.push(this.translateManager.t("form.ip.scan.freetext.list"));
        this.formManager.register(IpScanForm.class, values, labels, valuesWithoutFreetext);
    }

    /**
     * Start ip scanner service and update ip scan form
     */
    startIpScan() {
        const localIp = this.getLocalIp();
        if (localIp && !process.env.TEST) {
            const splitIp = this.getLocalIp().split(".");
            if (splitIp.length === 4) {
                const baseIp = splitIp[0] + "." + splitIp[1] + "."+ splitIp[2];
                const config = {
                    debug: false,
                    initial: true,
                    network: baseIp + ".1/24",
                    concurrency: 50, //amount of ips that are pinged in parallel
                    scanTimeout: 15000 //runs scan every 30 seconds (+ time it takes to execute 250 ips ~ 5 secs)
                };
                const scanner = new MacScanner(config);
                scanner.start();

                scanner.on("error", (error) => {
                    Logger.err(error.message);
                });
                scanner.on("scanned", (availableHosts) => {
                    Logger.verbose("New ip scanned received");
                    this.scannedIps = availableHosts;
                    let counter = availableHosts.length;
                    availableHosts.forEach((availableHost) => {
                        dns.reverse(availableHost.ip, (err, domains) => {
                            if (!err && domains && domains.length > 0) {
                                for (let i = 0 ; i < this.scannedIps.length ; i++) {
                                    if (this.scannedIps[i].ip === availableHost.ip) {
                                        this.scannedIps[i].name = domains[0];
                                    }
                                }
                            }
                            counter--;
                            if (counter <= 0) {
                                this.registerIpScanForm();
                                this.eventBus.emit(EVENT_SCAN_IP_UPDATE, {scannedIp:this.scannedIps});
                            }
                        });
                    });
                });

                scanner.on("entered", (target) => {
                    this.eventBus.emit(EVENT_SCAN_IP_CHANGES, {scannedIp:this.scannedIps, target:target});
                });

                scanner.on("left", (target) => {
                    this.eventBus.emit(EVENT_SCAN_IP_CHANGES, {scannedIp:this.scannedIps, target:target});
                });

                this.eventBus.on(this.eventStop, () => {
                    scanner.stop();
                    scanner.close();
                });
            }

        }
    }

    /**
     * Manage the uptime file
     */
    manageUptimeFile() {
        if (!process.env.TEST) {
            const uptimeFile = this.appConfiguration.configurationPath + UPTIME_FILE;

            if (fs.existsSync(uptimeFile)) {
                const powerOutageDuration = parseInt((DateUtils.class.timestamp() - parseInt(fs.readFileSync(uptimeFile))) / 60); // In minutes
                if (powerOutageDuration > 0) {
                    setTimeout((self) => {
                        self.messageManager.sendMessage("*", self.translateManager.t("power.outage.alert", powerOutageDuration));
                        this.eventBus.emit(EVENT_POWER_OUTAGE, {duration:(powerOutageDuration * 60)});
                    }, POWER_OUTAGE_DELAY, this);
                }
            }

            fs.writeFileSync(uptimeFile, DateUtils.class.timestamp());

            this.timeEventService.register(() => {
                fs.writeFileSync(uptimeFile, DateUtils.class.timestamp());
            }, this, TimeEventService.EVERY_MINUTES);

            this.eventBus.on(this.eventStop, () => {
                fs.unlinkSync(uptimeFile);
            });
        }
    }
}

module.exports = {class:EnvironmentManager, EVENT_SCAN_IP_CHANGES:EVENT_SCAN_IP_CHANGES, EVENT_SCAN_IP_UPDATE:EVENT_SCAN_IP_UPDATE, EVENT_POWER_OUTAGE:EVENT_POWER_OUTAGE};
