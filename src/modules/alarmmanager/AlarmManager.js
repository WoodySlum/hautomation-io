"use strict";
const Logger = require("./../../logger/Logger");
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("../../services/webservices/APIResponse");
const FormConfiguration = require("./../formconfiguration/FormConfiguration");
const AlarmForm = require("./AlarmForm");
const Tile = require("./../dashboardmanager/Tile");
const Icons = require("./../../utils/Icons");

const CONF_KEY = "alarm";
const SWITCH_ALARM_ROUTE_BASE = "/alarm/switch/set/";
const SWITCH_ALARM_ROUTE = ":"+ SWITCH_ALARM_ROUTE_BASE + "[status*]/";

/**
 * This class allows to manage alarm (nable, disable, ...)
 * @class
 */
class AlarmManager {
    /**
     * Constructor
     *
     * @param  {ConfManager} confManager A configuration manager needed for persistence
     * @param  {FormManager} formManager  A form manager
     * @param  {WebServices} webServices  The web services
     * @param  {DashboardManager} dashboardManager  The dashboard manager
     * @param  {UserManager} userManager  The user manager
     * @param  {SensorsManager} sensorsManager  The sensor manager
     * @param  {TranslateManager} translateManager  The translate manager
     * @returns {Alarm} The instance
     */
    constructor(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager) {
        this.formConfiguration = new FormConfiguration.class(confManager, formManager, webServices, CONF_KEY, false, AlarmForm.class);
        this.confManager = confManager;
        this.webServices = webServices;
        this.userManager = userManager;
        this.dashboardManager = dashboardManager;
        this.sensorsManager = sensorsManager;
        this.translateManager = translateManager;
        this.formManager = formManager;

        const self = this;
        this.userManager.registerHomeNotifications(() => {
            if (self.formConfiguration.data && self.formConfiguration.data.userLocationTrigger) {
                if (self.userManager.nobodyAtHome()) {
                    Logger.info("Enable alarm caused by nobody at home");
                    self.enableAlarm();
                } else if (self.userManager.somebodyAtHome()) {
                    Logger.info("Disable alarm caused by somebody at home");
                    self.disableAlarm();
                }
            }
        });

        this.webServices.registerAPI(this, WebServices.POST, SWITCH_ALARM_ROUTE, Authentication.AUTH_USAGE_LEVEL);
        this.registerTile();
    }

    /**
     * Register alarm tile
     */
    registerTile() {
        const tile = new Tile.class(this.dashboardManager.themeManager, "alarm", Tile.TILE_GENERIC_ACTION_STATUS, Icons.class.list()["uniF2DA"], null, this.translateManager.t("alarm.tile.title"), null, null, null, this.alarmStatus()?1:0, 5, SWITCH_ALARM_ROUTE_BASE);
        this.dashboardManager.registerTile(tile);
    }

    /**
     * Get alarm state
     *
     * @returns {boolean} True if alarm is enabled, false otherwise
     */
    alarmStatus() {
        if (this.formConfiguration.data && this.formConfiguration.data.enabled) {
            return this.formConfiguration.data.enabled;
        } else {
            return false;
        }

    }

    /**
     * Enable alarm
     */
    enableAlarm() {
        if (!this.alarmStatus()) {
            Logger.info("Enable alarm");
            this.formConfiguration.data.enabled = true;
            this.formConfiguration.save();
            this.registerTile();
        } else {
            Logger.info("Alarm already enabled");
        }
    }

    /**
     * Disable alarm
     */
    disableAlarm() {
        if (this.alarmStatus()) {
            Logger.info("Disable alarm");
            this.formConfiguration.data.enabled = false;
            this.formConfiguration.save();
            this.registerTile();
        } else {
            Logger.info("Alarm already disabled");
        }
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        var self = this;
        if (apiRequest.route.startsWith(":" + SWITCH_ALARM_ROUTE_BASE)) {
            return new Promise((resolve) => {
                if (apiRequest.data && apiRequest.data.status) {
                    if (parseInt(apiRequest.data.status)) {
                        self.enableAlarm();
                    } else {
                        self.disableAlarm();
                    }
                } else {
                    if (self.alarmStatus()) {
                        self.disableAlarm();
                    } else {
                        self.enableAlarm();
                    }
                }

                resolve(new APIResponse.class(true, {success:true}));
            });
        }
    }
}

module.exports = {class:AlarmManager};
