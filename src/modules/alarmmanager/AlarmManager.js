"use strict";
const path = require("path");
const fs = require("fs-extra");

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
const AlarmScenarioForm = require("./AlarmScenarioForm");
const AlarmScenarioTriggerForm = require("./AlarmScenarioTriggerForm");

const CONF_KEY = "alarm";
const SWITCH_ALARM_ROUTE_BASE = "/alarm/switch/set/";
const SWITCH_ALARM_ROUTE = ":"+ SWITCH_ALARM_ROUTE_BASE + "[status*]/";
const SENSORS_LOCK_TIME = 60 * 5; // In seconds
const ARMED_TIMER = 30; // In seconds. Will be scheduled in next minute. At least X seconds rounded to minute.
const ARMED_IDENTIFIER = "alarm-armed";
const RECORDING_TIME = 10;//60 * 5; // In seconds

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
     * @param  {ScenarioManager} scenarioManager  The scenario manager
     * @returns {Alarm} The instance
     */
    constructor(confManager, formManager, webServices, dashboardManager, userManager, sensorsManager, translateManager, deviceManager, messageManager, schedulerService, camerasManager, botEngine, scenarioManager) {
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
        this.scenarioManager = scenarioManager;
        this.formManager.register(AlarmSensorsForm.class);
        this.sensorsStatus = {};
        this.alarmTriggered = false;
        this.armedSoundTimer = null;

        if (!this.formConfiguration.data) {
            this.formConfiguration.data = {};
        }

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

        this.sensorsManager.registerSensorEvent((id, type, value) => {
            if (value > 0 && self.alarmStatus() && self.formConfiguration.data && self.formConfiguration.data.armed && self.formConfiguration.data.sensors && self.formConfiguration.data.sensors.length > 0) {
                self.formConfiguration.data.sensors.forEach((sensorConfiguration) => {
                    if (id === sensorConfiguration.sensor.identifier) {
                        const sensor = self.sensorsManager.getSensorConfiguration(sensorConfiguration.sensor.identifier);
                        if (sensor && self.sensorReadyForTriggering(sensorConfiguration.sensor.identifier)) {
                            // Set timestamp for sensor in cache
                            self.sensorsStatus[sensorConfiguration.sensor.identifier] = DateUtils.class.timestamp();
                            if (sensorConfiguration.triggerAlarm) {
                                self.triggerAlarm();
                                self.messageManager.sendMessage("*", self.translateManager.t("alarm.manager.alert.sensor", sensor.name), null, null, null, true);
                                Logger.info("Alert for sensor " + sensor.id + " (" + sensor.name + "). Release lock : " + (self.sensorsStatus[sensorConfiguration.sensor.identifier] + SENSORS_LOCK_TIME));
                            } else {
                                self.messageManager.sendMessage("*", self.translateManager.t("alarm.manager.pre.alert", sensor.name), null, null, null, true);
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

        this.scenarioManager.register(AlarmScenarioForm.class, (scenario) => {
            if (scenario && scenario.AlarmScenarioForm && scenario.AlarmScenarioForm.action && scenario.AlarmScenarioForm.action != "none") {
                if (scenario.AlarmScenarioForm.action === "enable") {
                    this.enableAlarm();
                } else if (scenario.AlarmScenarioForm.action === "disable") {
                    this.disableAlarm();
                } else if (scenario.AlarmScenarioForm.action === "trigger") {
                    this.triggerAlarm();
                }
            }
        }, "alarm.scenario.form.title");

        this.scenarioManager.register(AlarmScenarioTriggerForm.class, null, "alarm.scenario.trigger.form.title", 200);


        this.webServices.registerAPI(this, WebServices.POST, SWITCH_ALARM_ROUTE, Authentication.AUTH_GUEST_LEVEL);
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
        const background = fs.readFileSync("./res/tiles/alarm.jpg").toString("base64");
        // Credits : Freepik / https://www.flaticon.com/free-icon/alert_3285061
        const svg = "<svg id=\"Capa_1\" enable-background=\"new 0 0 512 512\" height=\"512\" viewBox=\"0 0 512 512\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><g><path d=\"m497 482h-46v-17c0-24.853-20.147-45-45-45h-300c-24.853 0-45 20.147-45 45v17h-46c-8.284 0-15 6.716-15 15s6.716 15 15 15h482c8.284 0 15-6.716 15-15s-6.716-15-15-15z\"/><path d=\"m256 70c8.284 0 15-6.716 15-15v-40c0-8.284-6.716-15-15-15s-15 6.716-15 15v40c0 8.284 6.716 15 15 15z\"/><path d=\"m429.219 170.002c2.544 0 5.124-.648 7.486-2.012l34.641-20c7.174-4.142 9.632-13.316 5.49-20.49-4.142-7.175-13.315-9.633-20.49-5.49l-34.641 20c-7.174 4.142-9.632 13.316-5.49 20.49 2.778 4.812 7.82 7.502 13.004 7.502z\"/><path d=\"m348.5 94.785c2.362 1.364 4.941 2.012 7.486 2.012 5.184 0 10.227-2.69 13.004-7.502l20-34.641c4.142-7.174 1.684-16.348-5.49-20.49-7.176-4.144-16.35-1.685-20.49 5.49l-20 34.641c-4.142 7.174-1.684 16.348 5.49 20.49z\"/><path d=\"m143.01 89.295c2.778 4.812 7.82 7.502 13.004 7.502 2.544 0 5.124-.648 7.486-2.012 7.174-4.142 9.632-13.316 5.49-20.49l-20-34.641c-4.142-7.174-13.316-9.633-20.49-5.49-7.174 4.142-9.632 13.316-5.49 20.49z\"/><path d=\"m40.654 147.99 34.641 20c2.362 1.364 4.941 2.012 7.486 2.012 5.184 0 10.227-2.69 13.004-7.502 4.142-7.174 1.684-16.348-5.49-20.49l-34.641-20c-7.174-4.143-16.349-1.684-20.49 5.49-4.143 7.174-1.685 16.348 5.49 20.49z\"/><path d=\"m191 355c0-12.478 3.661-24.559 10.361-34.913-19.062-15.948-30.361-39.584-30.361-65.087 0-46.869 38.131-85 85-85s85 38.131 85 85c0 25.503-11.299 49.139-30.36 65.087 6.699 10.354 10.36 22.435 10.36 34.913v35h90v-135c0-85.467-69.533-155-155-155s-155 69.533-155 155v135h90z\"/><path d=\"m281.328 303.782c18.302-9.529 29.672-28.22 29.672-48.782 0-30.327-24.673-55-55-55s-55 24.673-55 55c0 20.562 11.37 39.253 29.672 48.782 4.426 2.304 7.417 6.659 7.978 11.618.562 4.958-1.38 9.872-5.179 13.107-7.926 6.749-12.471 16.406-12.471 26.493v35h70v-35c0-10.087-4.545-19.744-12.471-26.494-3.799-3.235-5.741-8.148-5.179-13.107s3.552-9.313 7.978-11.617z\"/></g></svg>";
        const tile = new Tile.class(this.dashboardManager.themeManager, "alarm", Tile.TILE_GENERIC_ACTION_STATUS, svg, null, this.translateManager.t("alarm.tile.title"), null, background, null, this.alarmStatus()?1:0, 5, SWITCH_ALARM_ROUTE_BASE, null, Authentication.AUTH_GUEST_LEVEL);
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
        }, 5000, this);
    }

    /**
     * Cancel the armed alarm
     */
    armCancel() {
        Logger.info("Cancelling alarm arm");
        this.schedulerService.cancel(ARMED_IDENTIFIER);
        this.formConfiguration.data.armed = false;
        this.formConfiguration.save();
        if (this.armedSoundTimer) {
            clearInterval(this.armedSoundTimer);
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
            this.armAlarm();

            this.scenarioManager.getScenarios().forEach((scenario) => {
                if (scenario.AlarmScenarioTriggerForm && scenario.AlarmScenarioTriggerForm.trigger && scenario.AlarmScenarioTriggerForm.trigger === "enable") {
                    this.scenarioManager.triggerScenario(scenario);
                }
            });
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

            this.scenarioManager.getScenarios().forEach((scenario) => {
                if (scenario.AlarmScenarioTriggerForm && scenario.AlarmScenarioTriggerForm.trigger && scenario.AlarmScenarioTriggerForm.trigger === "disable") {
                    this.scenarioManager.triggerScenario(scenario);
                }
            });
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
            this.messageManager.sendMessage("*", this.translateManager.t("alarm.manager.alert"), null, null, null, true);

            this.scenarioManager.getScenarios().forEach((scenario) => {
                if (scenario.AlarmScenarioTriggerForm && scenario.AlarmScenarioTriggerForm.trigger && scenario.AlarmScenarioTriggerForm.trigger === "trigger") {
                    this.scenarioManager.triggerScenario(scenario);
                }
            });
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
