"use strict";
const path = require("path");

const Logger = require("./../../logger/Logger");
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("../../services/webservices/APIResponse");
const FormConfiguration = require("./../formconfiguration/FormConfiguration");
const AlarmForm = require("./AlarmForm");
const AlarmSensorsForm = require("./AlarmSensorsForm");
const Tile = require("./../dashboardmanager/Tile");
const Icons = require("./../../utils/Icons");
const DateUtils = require("./../../utils/DateUtils");

const CONF_KEY = "alarm";
const SWITCH_ALARM_ROUTE_BASE = "/alarm/switch/set/";
const SWITCH_ALARM_ROUTE = ":"+ SWITCH_ALARM_ROUTE_BASE + "[status*]/";
const SENSORS_LOCK_TIME = 60 * 5; // In seconds
const ARMED_TIMER = 30; // In seconds. Will be scheduled in next minute. At least X seconds rounded to minute.
const ARMED_IDENTIFIER = "alarm-armed";
const RECORDING_TIME = 60 * 5; // In seconds

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
     * @param  {DeviceManager} deviceManager  The device manager
     * @param  {MessageManager} messageManager  The message manager
     * @param  {SchedulerService} schedulerService  The Scheduler service
     * @param  {CamerasManager} camerasManager  The cameras manager
     * @param  {BotEngine} botEngine  The bot engine
     * @returns {Alarm} The instance
     */
    constructor(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine) {
        this.formConfiguration = new FormConfiguration.class(confManager, formManager, webServices, CONF_KEY, false, AlarmForm.class);
        this.confManager = confManager;
        this.webServices = webServices;
        this.userManager = userManager;
        this.dashboardManager = dashboardManager;
        this.sensorsManager = sensorsManager;
        this.translateManager = translateManager;
        this.formManager = formManager;
        this.deviceManager = deviceManager;
        this.messageManager = messageManager;
        this.schedulerService = schedulerService;
        this.camerasManager = camerasManager;
        this.botEngine = botEngine;
        this.formManager.register(AlarmSensorsForm.class);
        this.sensorsStatus = {};
        this.alarmTriggered = false;
        this.armedSoundTimer = null;

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

        this.schedulerService.register(ARMED_IDENTIFIER, () => {
            Logger.info("Alarm is armed");
            self.formConfiguration.data.armed = true;
            self.formConfiguration.save();
        });

        this.sensorsManager.registerSensorEvent((id) => {
            if (self.alarmStatus() && self.formConfiguration.data && self.formConfiguration.data.armed && self.formConfiguration.data.sensors && self.formConfiguration.data.sensors.length > 0) {
                self.formConfiguration.data.sensors.forEach((sensorConfiguration) => {
                    if (id === sensorConfiguration.sensor.identifier) {
                        const sensor = self.sensorsManager.getSensorConfiguration(sensorConfiguration.sensor.identifier);
                        if (sensor && self.sensorReadyForTriggering(sensorConfiguration.sensor.identifier)) {
                            // Set timestamp for sensor in cache
                            self.sensorsStatus[sensorConfiguration.sensor.identifier] = DateUtils.class.timestamp();
                            if (sensorConfiguration.triggerAlarm) {
                                self.triggerAlarm();
                                self.messageManager.sendMessage("*", self.translateManager.t("alarm.manager.alert.sensor", sensor.name));
                                Logger.info("Alert for sensor " + sensor.id + " (" + sensor.name + "). Release lock : " + (self.sensorsStatus[sensorConfiguration.sensor.identifier] + SENSORS_LOCK_TIME));
                            } else {
                                self.messageManager.sendMessage("*", self.translateManager.t("alarm.manager.pre.alert", sensor.name));
                                Logger.info("Pre alert for sensor " + sensor.id + " (" + sensor.name + "). Release lock : " + (self.sensorsStatus[sensorConfiguration.sensor.identifier] + SENSORS_LOCK_TIME));
                            }

                            if (sensorConfiguration.captureVideo) {
                                this.camerasManager.getCamerasList().forEach((camera) => {
                                    this.camerasManager.getImage(camera.id, (err, data) => {
                                        if (!err && data) {
                                            self.messageManager.sendMessage("*", null, "cameras", null, data.toString("base64"));
                                        } else {
                                            Logger.err(err);
                                        }
                                    });
                                    this.camerasManager.record(camera.id, (err, generatedFilepath) => {
                                        if (!err && generatedFilepath) {
                                            Logger.info("Recording session for alarm path : " + generatedFilepath);
                                        } else {
                                            Logger.err(err.message);
                                        }

                                    }, RECORDING_TIME);
                                });

                            }
                        }
                    }
                });
            }
        });


        this.webServices.registerAPI(this, WebServices.POST, SWITCH_ALARM_ROUTE, Authentication.AUTH_USAGE_LEVEL);
        this.registerTile();
    }

    /**
     * Check if sensor is ready for triggering events
     *
     * @param  {string} sensorId The sensor identifier
     * @returns {boolean}          True if alarm can be trigger, false otherwise
     */
    sensorReadyForTriggering(sensorId) {
        if (this.sensorsStatus[sensorId]) {
            if ((DateUtils.class.timestamp() - this.sensorsStatus[sensorId]) <= SENSORS_LOCK_TIME) {
                return false;
            }
        }

        return true;
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
     * Arm the alarm
     */
    armAlarm() {
        this.armCancel();
        this.schedulerService.schedule(ARMED_IDENTIFIER, (DateUtils.class.timestamp() + ARMED_TIMER));
        Logger.info("Alarm will be armed at " + (DateUtils.class.timestamp() + ARMED_TIMER));

        this.botEngine.textToSpeech(this.translateManager.t("alarm.armed.speak"));

        this.armedSoundTimer = setInterval((self) => {
            if (self.formConfiguration.data.enabled && !self.formConfiguration.data.armed) {
                self.botEngine.playSound(path.resolve("./res/sounds/beep.mp3"));
            }

            if (self.armedSoundTimer && self.formConfiguration.data.armed) {
                clearInterval(self.armedSoundTimer);
                self.botEngine.textToSpeech(self.translateManager.t("alarm.enabled.speak"));
            }
        }, 2000, this);
    }

    /**
     * Cancel the armed alarm
     */
    armCancel() {
        Logger.info("Cancelling alarm arm");
        this.schedulerService.cancel(ARMED_IDENTIFIER);
        this.formConfiguration.data.armed = false;
        this.formConfiguration.save();
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
            this.armAlarm();
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
            this.armCancel();
            this.registerTile();
            this.stopAlarm(); // Stop sirens and ...
            this.botEngine.textToSpeech(this.translateManager.t("alarm.disabled.speak"));
        } else {
            Logger.info("Alarm already disabled");
        }
    }

    /**
     * Trigger the alarm (sirens, ...)
     */
    triggerAlarm() {
        if (!this.alarmTriggered) {
            this.alarmTriggered = true;
            const config = this.formConfiguration.getDataCopy();
            Logger.info("Alarm has been triggered");
            if (config && config.devicesOnEnable && config.devicesOnEnable.length > 0) {
                config.devicesOnEnable.forEach((device) => {
                    this.deviceManager.switchDevice(device.identifier, device.status);
                });
            }
            this.messageManager.sendMessage("*", this.translateManager.t("alarm.manager.alert"));
        } else {
            Logger.info("Alarm already triggered");
        }
    }

    /**
     * Stop the alarm (sirens, ...)
     */
    stopAlarm() {
        if (this.alarmTriggered) {
            this.alarmTriggered = false;
            const config = this.formConfiguration.getDataCopy();
            if (config && config.devicesOnDisable && config.devicesOnDisable.length > 0) {
                config.devicesOnDisable.forEach((device) => {
                    this.deviceManager.switchDevice(device.identifier, device.status);
                });
            }
        } else {
            Logger.info("Alarm already stopped");
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

module.exports = {class:AlarmManager, SENSORS_LOCK_TIME:SENSORS_LOCK_TIME};
