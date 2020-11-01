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
const wc = require("which-country");
const season = require("month-season");
const Logger = require("./../../logger/Logger");
const FormConfiguration = require("./../formconfiguration/FormConfiguration");
const EnvironmentForm = require("./EnvironmentForm");
const Tile = require("./../dashboardmanager/Tile");
const DayNightScenarioForm = require("./DayNightScenarioForm");
const DayNightScenarioTriggerForm = require("./DayNightScenarioTriggerForm");
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");
const SmartiesRunnerConstants = require("./../../../SmartiesRunnerConstants");
const IpScanForm = require("./IpScanForm");
const DateUtils = require("../../utils/DateUtils");
const ROUTE_APP_ENVIRONMENT_INFORMATION = "/environment/app/get/";
const ROUTE_APP_SET_CONFIGURATION = "/environment/conf/set/";
const ROUTE_APP_GET_CONFIGURATION = "/environment/conf/get/";
const MAIN_CONFIG_PATH = "./data/config.json";
const DEBIAN_REPOSITORY = "https://deb.smarties.io/";
const DEBIAN_REPOSITORY_LAST_VERSION = "dists/{dist}/main/binary-{arch}/Packages";
const EVENT_SCAN_IP_CHANGES = "scan-ip-change";
const EVENT_SCAN_IP_UPDATE = "scan-ip-update";
// const UPTIME_FILE = ".uptime";
const EVENT_POWER_OUTAGE = "power-outage";
// const POWER_OUTAGE_DELAY = 10 * 1000;

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
        this.formManager.register(DayNightScenarioTriggerForm.class);
        this.scenarioManager.register(DayNightScenarioTriggerForm.class, null, "daynight.scenario.trigger.title", 200);
        this.scenarioManager.register(DayNightScenarioForm.class, (scenario) => {
            if (scenario && scenario.DayNightScenarioForm && scenario.DayNightScenarioForm.mode) {
                if (scenario.DayNightScenarioForm.mode === "1") {
                    this.setDay();
                } else if (scenario.DayNightScenarioForm.mode === "2") {
                    this.setNight();
                }
            }
        }, "daynight.scenario.title");

        this.version = version;
        this.hash = hash;
        this.installationManager = installationManager;
        this.timeEventService = timeEventService;
        this.messageManager = messageManager;
        this.eventStop = eventStop;
        this.eventReady = eventReady;
        this.userManager = userManager;
        this.userManager.environmentManager = this;
        this.dist = null;
        this.arch = null;
        this.scanner = null;
        this.scannedIps = [];
        this.manageUptimeFile();
        webServices.registerAPI(this, WebServices.GET, ":" + ROUTE_APP_ENVIRONMENT_INFORMATION, Authentication.AUTH_GUEST_LEVEL);
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


        if (!this.appConfiguration.disableIpScan) {
            setTimeout((self) => {
                self.startIpScan();
            }, 30000, this);
        }
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
        // Credits : kosonicon / https://www.flaticon.com/premium-icon/sunny_3222672
        let icon = "<svg xmlns=\"http://www.w3.org/2000/svg\" id=\"outline\" viewBox=\"0 0 512 512\" width=\"512\" height=\"512\"><path d=\"M256,96.745C168.187,96.745,96.745,168.187,96.745,256S168.187,415.255,256,415.255,415.255,343.813,415.255,256,343.813,96.745,256,96.745Zm0,298.51c-76.786,0-139.255-62.469-139.255-139.255S179.214,116.745,256,116.745,395.255,179.214,395.255,256,332.786,395.255,256,395.255Z\"/><path d=\"M256,67.293a10,10,0,0,0,10-10V10a10,10,0,0,0-20,0V57.293A10,10,0,0,0,256,67.293Z\"/><path d=\"M256,444.707a10,10,0,0,0-10,10V502a10,10,0,0,0,20,0V454.707A10,10,0,0,0,256,444.707Z\"/><path d=\"M147.986,88.915a10,10,0,0,0,17.321-10L141.66,37.958a10,10,0,1,0-17.32,10Z\"/><path d=\"M364.014,423.085a10,10,0,0,0-17.321,10l23.647,40.957a10,10,0,1,0,17.32-10Z\"/><path d=\"M88.915,147.986,47.958,124.34a10,10,0,1,0-10,17.32l40.957,23.647a10,10,0,0,0,10-17.321Z\"/><path d=\"M474.042,370.34l-40.957-23.647a10,10,0,0,0-10,17.321l40.957,23.646a10,10,0,1,0,10-17.32Z\"/><path d=\"M67.293,256a10,10,0,0,0-10-10H10a10,10,0,0,0,0,20H57.293A10,10,0,0,0,67.293,256Z\"/><path d=\"M502,246H454.707a10,10,0,0,0,0,20H502a10,10,0,0,0,0-20Z\"/><path d=\"M78.915,346.693,37.958,370.34a10,10,0,1,0,10,17.32l40.957-23.646a10,10,0,0,0-10-17.321Z\"/><path d=\"M428.1,166.648a9.953,9.953,0,0,0,4.99-1.341l40.957-23.647a10,10,0,1,0-10-17.32l-40.957,23.646a10,10,0,0,0,5.01,18.662Z\"/><path d=\"M161.646,419.425a10,10,0,0,0-13.66,3.66L124.34,464.042a10,10,0,1,0,17.32,10l23.647-40.957A10,10,0,0,0,161.646,419.425Z\"/><path d=\"M350.354,92.575a10,10,0,0,0,13.66-3.66L387.66,47.958a10,10,0,1,0-17.32-10L346.693,78.915A10,10,0,0,0,350.354,92.575Z\"/></svg>";
        let background = fs.readFileSync("./res/tiles/day.jpg").toString("base64");
        if (this.isNight()) {
            tileTitle = this.translateManager.t("environment.night");
            // Credits : kosonicon / https://www.flaticon.com/premium-icon/crescent-moon_3222719
            icon = "<svg id=\"outline\" height=\"512\" viewBox=\"0 0 512 512\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m263.567 512a256.078 256.078 0 0 1 -184.079-434.108 254.733 254.733 0 0 1 174.891-77.886 10 10 0 0 1 6.871 17.578 194.977 194.977 0 0 0 -68 148c0 107.564 87.51 195.074 195.074 195.074a194.719 194.719 0 0 0 101.013-28.156 10 10 0 0 1 14.569 12.01 256.181 256.181 0 0 1 -240.339 167.488zm-35.845-489.458a236.1 236.1 0 0 0 -131.094 400.31 236.191 236.191 0 0 0 377.5-60 215.093 215.093 0 0 1 -246.4-340.308z\"/></svg>";
            background = fs.readFileSync("./res/tiles/night.jpg").toString("base64");
        }
        //TILE_INFO_ONE_TEXT
        const tile = new Tile.class(this.dashboardManager.themeManager, "day-night", Tile.TILE_GENERIC_ACTION_DARK, icon, null, tileTitle, null, background, null, null, 200);
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
     * Get ISO-3166-3 country code
     *
     * @returns {string} The ISO-3166-3 country code
     */
    getCountry() {
        if (this.getCoordinates()) {
            return wc([this.getCoordinates().longitude, this.getCoordinates().latitude]);
        }

        return null;
    }

    /**
     * Get the season
     *
     * @param  {number} [timestamp=null]      A timestamp
     *
     * @returns {string} The ISO-3166-3 country code
     */
    getSeason(timestamp = null) {
        if (!timestamp) {
            timestamp = DateUtils.class.timestamp();
        }
        const date = new Date(DateUtils.class.dateFormatted("YYYY-MM-DD HH:mm:ss", timestamp));

        return season(date.getMonth(), "en");
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
            if (scenario.DayNightScenarioTriggerForm && scenario.DayNightScenarioTriggerForm.day && !this.isNight()) {
                this.scenarioManager.triggerScenario(scenario);
            }

            if (scenario.DayNightScenarioTriggerForm && scenario.DayNightScenarioTriggerForm.night && this.isNight()) {
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
     * @returns {number} The local smarties HTTP port
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

        // Ngrok part
        if (data.ngrokAuthToken) {
            mainConfiguration.ngrokAuthToken = data.ngrokAuthToken;
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
            self.eventBus.emit(SmartiesRunnerConstants.RESTART);
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
                resolve(new APIResponse.class(true, {version:this.version, hash:this.hash, smartiesId: this.getSmartiesId(), customIdentifier:this.appConfiguration.customIdentifier}));
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
        if (os.platform() === "linux" && !process.env.DOCKER) {
            Logger.info("Looking for linux core update");

            try {
                this.arch = childProcess.execSync("dpkg --print-architecture").toString();
                this.dist = childProcess.execSync("dpkg --status tzdata|grep Provides|cut -f2 -d'-'").toString();
            } catch(e) {
                Logger.err(e.message);
            }

            if (this.arch && this.dist) {
                try {
                    const req = https.get(DEBIAN_REPOSITORY + DEBIAN_REPOSITORY_LAST_VERSION.replace("{arch}", this.arch).replace("{arch}", this.arch).replace("{dist}", this.dist), (response) => {
                        let body = "";
                        response.on("data", (d) => {
                            body += d;
                        });
                        response.on("end", () => {
                            if (response.statusCode === 200 && body.length > 0) {
                                const splitBody = body.split("\n\n");
                                if (splitBody.length > 1) {
                                    const lastElement = splitBody[splitBody.length - 2];

                                    const versionRegex = /Version: ([0-9.]+)/gm;
                                    const rRegex = versionRegex.exec(lastElement);
                                    const hashRegex = /SHA256: ([0-9a-z]+)/gm;
                                    const rhashRegex = hashRegex.exec(lastElement);
                                    const fileRegex = /Filename: ([a-zA-Z/\-._0-9]+)/gm;
                                    const rfileRegex = fileRegex.exec(lastElement);


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
                                                fs.writeFileSync(updateScript, "service smarties stop && apt-get update && apt-get install --reinstall -y --allow-unauthenticated smarties && service smarties start");
                                                fs.chmodSync(updateScript, 0o555);
                                                childProcess.execSync("echo \"/bin/sh " + updateScript + "\" | at now + 1 minute");
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
                                    Logger.err("No version split found in rep");
                                }
                            } else {
                                Logger.err("Could not contact deb repo : HTTP error " + response.statusCode);
                            }
                        });
                    });

                    req.on("error", (e) => {
                        Logger.err(e.message);
                    });
                } catch(e) {
                    Logger.err(e.message);
                }
            } else {
                Logger.err("Undefined arch or dist");
            }
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
     * Returns the smarties ID
     *
     * @returns {string} Smarties identifier
     */
    getSmartiesId() {
        return machineId.machineIdSync().substr(0,4);
    }

    /**
     * Returns the full smarties ID
     *
     * @returns {string} Smarties full identifier
     */
    getFullSmartiesId() {
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
        valuesWithoutFreetext.push("-");
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
                    concurrency: 10, //amount of ips that are pinged in parallel
                    scanTimeout: 60000 //runs scan every 30 seconds (+ time it takes to execute 250 ips ~ 5 secs)
                };
                Logger.verbose("Start ip scan");
                Logger.verbose(config);
                if (this.scanner) {
                    this.scanner.stop();
                    this.scanner = null;
                }
                this.scanner = new MacScanner(config);
                this.scanner.start();

                this.scanner.on("error", (error) => {
                    Logger.err(error.message);
                });

                this.scanner.on("entered", (target) => {
                    Logger.verbose("New ip received");
                    Logger.verbose(target);
                    let found = false;
                    for (let j = 0 ; j < this.scannedIps.length ; j++) {
                        if (this.scannedIps[j].ip === target.ip) {
                            found = true;
                        }
                    }

                    if (!found) {
                        this.scannedIps.push(target);
                        dns.reverse(target.ip, (err, domains) => {
                            if (!err && domains && domains.length > 0) {
                                for (let i = 0 ; i < this.scannedIps.length ; i++) {
                                    if (this.scannedIps[i].ip === target.ip) {
                                        this.scannedIps[i].name = domains[0];
                                        this.registerIpScanForm();
                                    }
                                }
                            }
                        });
                    }

                    this.registerIpScanForm();
                    this.eventBus.emit(EVENT_SCAN_IP_UPDATE, {scannedIp:this.scannedIps});
                    this.eventBus.emit(EVENT_SCAN_IP_CHANGES, {scannedIp:this.scannedIps, target:target});
                });

                this.scanner.on("left", (target) => {
                    Logger.verbose("New ip removed");
                    Logger.verbose(target);
                    let found = -1;
                    for (let i = 0 ; i < this.scannedIps.length ; i++) {
                        if (this.scannedIps[i].ip === target.ip) {
                            found = i;
                        }
                    }
                    if (found >= 0) {
                        this.scannedIps.splice(found, 1);
                    }

                    this.eventBus.emit(EVENT_SCAN_IP_CHANGES, {scannedIp:this.scannedIps, target:target});
                });

                this.eventBus.on(this.eventStop, () => {
                    this.scanner.stop();
                    this.scanner.close();
                });
            }

        }
    }

    /**
     * Manage the uptime file
     */
    manageUptimeFile() {
        if (!process.env.TEST) {
            // const uptimeFile = this.appConfiguration.configurationPath + UPTIME_FILE;
            //
            // if (fs.existsSync(uptimeFile)) {
            //     const powerOutageDuration = parseInt((DateUtils.class.timestamp() - parseInt(fs.readFileSync(uptimeFile))) / 60); // In minutes
            //     if (powerOutageDuration > 0) {
            //         setTimeout((self) => {
            //             self.messageManager.sendMessage("*", self.translateManager.t("power.outage.alert", powerOutageDuration));
            //             this.eventBus.emit(EVENT_POWER_OUTAGE, {duration:(powerOutageDuration * 60)});
            //         }, POWER_OUTAGE_DELAY, this);
            //     }
            // }

            // fs.writeFileSync(uptimeFile, DateUtils.class.timestamp());
            //
            // this.timeEventService.register(() => {
            //     fs.writeFileSync(uptimeFile, DateUtils.class.timestamp());
            // }, this, TimeEventService.EVERY_MINUTES);
            //
            // this.eventBus.on(this.eventStop, () => {
            //     fs.unlinkSync(uptimeFile);
            // });
        }
    }
}

module.exports = {class:EnvironmentManager, EVENT_SCAN_IP_CHANGES:EVENT_SCAN_IP_CHANGES, EVENT_SCAN_IP_UPDATE:EVENT_SCAN_IP_UPDATE, EVENT_POWER_OUTAGE:EVENT_POWER_OUTAGE};
