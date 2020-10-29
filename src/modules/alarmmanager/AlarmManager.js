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
        // Credits : Freepik / https://www.flaticon.com/free-icon/alarm_940615
        const svg = "<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"	 viewBox=\"0 0 512 512\" style=\"enable-background:new 0 0 512 512;\" xml:space=\"preserve\"><g>	<g>		<path d=\"M418.998,498.791l-25.075-73.998c-1.375-4.06-5.185-6.791-9.471-6.791h-1.455v-145.01			c0-70.026-56.97-126.997-126.997-126.997s-126.997,56.97-126.997,126.997v145.01h-1.455c-4.286,0-8.096,2.731-9.471,6.791			l-25.074,73.998c-1.035,3.053-0.534,6.416,1.344,9.036c1.878,2.619,4.903,4.173,8.127,4.173h307.053			c3.224,0,6.249-1.554,8.127-4.173C419.532,505.207,420.033,501.844,418.998,498.791z M149.003,272.993			c0-58.998,47.999-106.997,106.997-106.997c58.998,0,106.997,47.999,106.997,106.997v145.01H149.003V272.993z M116.421,492.001			l18.297-53.998h242.563l18.298,53.998H116.421z\"/>	</g></g><g>	<g>		<path d=\"M256,0c-5.522,0-10,4.478-10,10v59.999c0,5.522,4.477,10,10,10c5.522,0,10-4.478,10-10V10C266,4.478,261.522,0,256,0z\"/>	</g></g><g>	<g>		<path d=\"M263.069,101.884c-1.859-1.86-4.439-2.92-7.069-2.92s-5.21,1.06-7.07,2.92c-1.86,1.87-2.93,4.439-2.93,7.08			c0,2.63,1.069,5.2,2.93,7.07c1.86,1.859,4.44,2.92,7.07,2.92s5.21-1.061,7.069-2.92c1.86-1.87,2.931-4.44,2.931-7.07			C266,106.323,264.93,103.754,263.069,101.884z\"/>	</g></g><g>	<g>		<path d=\"M95.504,267.66H49.587c-5.522,0-10,4.478-10,10s4.478,10,10,10h45.918c5.522,0,10-4.478,10-10			S101.026,267.66,95.504,267.66z\"/>	</g></g><g>	<g>		<path d=\"M17.076,270.59c-1.859-1.861-4.439-2.93-7.069-2.93s-5.21,1.069-7.07,2.93c-1.86,1.861-2.93,4.44-2.93,7.07			s1.069,5.21,2.93,7.069c1.86,1.86,4.44,2.931,7.07,2.931s5.21-1.07,7.069-2.931c1.86-1.859,2.931-4.439,2.931-7.069			S18.936,272.45,17.076,270.59z\"/>	</g></g><g>	<g>		<path d=\"M188.673,88.988l-13.554-32.721c-2.114-5.102-7.963-7.521-13.066-5.412c-5.103,2.114-7.525,7.964-5.412,13.066			l13.554,32.721c1.596,3.851,5.319,6.176,9.243,6.176c1.275,0,2.571-0.246,3.823-0.764			C188.364,99.939,190.786,94.089,188.673,88.988z\"/>	</g></g><g>	<g>		<path d=\"M74.981,191.855L42.26,178.301c-5.104-2.108-10.952,0.311-13.066,5.412c-2.113,5.103,0.31,10.952,5.412,13.066			l32.721,13.554c1.252,0.517,2.548,0.764,3.823,0.764c3.924,0,7.647-2.325,9.243-6.176			C82.506,199.818,80.083,193.969,74.981,191.855z\"/>	</g></g><g>	<g>		<path d=\"M466.58,267.66h-45.918c-5.522,0-10,4.478-10,10s4.478,10,10,10h45.918c5.522,0,10-4.478,10-10			S472.102,267.66,466.58,267.66z\"/>	</g></g><g>	<g>		<path d=\"M509.062,270.59c-1.859-1.86-4.439-2.93-7.069-2.93s-5.21,1.069-7.07,2.93s-2.93,4.44-2.93,7.07s1.069,5.21,2.93,7.069			c1.86,1.86,4.44,2.931,7.07,2.931s5.21-1.07,7.069-2.931c1.86-1.859,2.931-4.439,2.931-7.069S510.923,272.45,509.062,270.59z\"/>	</g></g><g>	<g>		<path d=\"M453.748,79.909c-3.906-3.904-10.236-3.904-14.143,0l-49.203,49.204c-3.905,3.905-3.905,10.237,0,14.143			c1.954,1.953,4.513,2.929,7.072,2.929c2.56,0,5.118-0.977,7.071-2.929l49.203-49.204			C457.652,90.147,457.652,83.815,453.748,79.909z\"/>	</g></g><g>	<g>		<path d=\"M121.596,129.113L72.393,79.911c-3.906-3.904-10.236-3.904-14.143,0c-3.905,3.905-3.905,10.237,0,14.143l49.204,49.203			c1.953,1.952,4.512,2.929,7.071,2.929c2.559,0,5.118-0.977,7.071-2.929C125.501,139.351,125.501,133.019,121.596,129.113z\"/>	</g></g><g>	<g>		<path d=\"M349.945,50.855c-5.103-2.108-10.952,0.311-13.066,5.412l-13.554,32.721c-2.113,5.102,0.31,10.951,5.412,13.066			c1.252,0.518,2.548,0.764,3.823,0.764c3.924,0,7.647-2.325,9.243-6.176l13.554-32.721			C357.47,58.817,355.047,52.969,349.945,50.855z\"/>	</g></g><g>	<g>		<path d=\"M482.805,183.713c-2.114-5.103-7.963-7.522-13.066-5.412l-32.721,13.554c-5.103,2.114-7.525,7.964-5.412,13.066			c1.596,3.851,5.319,6.176,9.243,6.176c1.275,0,2.571-0.246,3.823-0.764l32.721-13.554			C482.496,194.665,484.918,188.815,482.805,183.713z\"/>	</g></g><g>	<g>		<path d=\"M256,209.008c-16.542,0-29.999,13.458-29.999,29.999v47.999c0,16.542,13.458,29.999,29.999,29.999			s29.999-13.458,29.999-29.999v-47.999C285.999,222.466,272.542,209.008,256,209.008z M266,287.006c0,5.514-4.486,10-10,10			s-10-4.486-10-10v-47.999c0-5.514,4.486-10,10-10s10,4.486,10,10V287.006z\"/>	</g></g><g>	<g>		<path d=\"M256,337.005c-16.542,0-29.999,13.458-29.999,29.999c0,16.542,13.458,29.999,29.999,29.999s29.999-13.458,29.999-29.999			C285.999,350.462,272.542,337.005,256,337.005z M256,377.004c-5.514,0-10-4.486-10-10s4.486-10,10-10s10,4.486,10,10			S261.514,377.004,256,377.004z\"/>	</g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>";
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
