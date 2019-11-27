"use strict";

const PERCENTAGE_THRESHOLD = 15;
const RANDOM_MAX = 100;
const RANDOM_THRESHOLD = 85;
const HISTORY_NB_MONTH = 3;

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();
    const Logger = api.exported.Logger;
    const DateUtils = api.exported.DateUtils;

    /**
    * This class is used for presence simulator form
    * @class
    */
    class PresenceSimulatorForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id           Identifier
         * @param  {string} enabled       Enable function
         * @param  {Array} excludeDevices       The devices to exclude
         * @returns {PresenceSimulatorForm}              The instance
         */
        constructor(id, enabled, excludeDevices) {
            super(id);

            /**
             * @Property("enabled");
             * @Type("string");
             * @Title("presence.simulator.form.enabled");
             * @Enum(["on", "off"]);
             * @EnumNames(["presence.simulator.form.enabled.on", "presence.simulator.form.enabled.off"]);
             * @Default("on");
             * @Display("radio");
             */
            this.enabled = enabled;

            /**
             * @Property("excludeDevices");
             * @Title("presence.simulator.form.exclude.devices");
             * @Type("objects");
             * @Cl("DevicesListForm");
             */
            this.excludeDevices = excludeDevices;
        }

        /**
         * Convert json data
         *
         * @param  {Object} data Some key / value data
         * @returns {PresenceSimulatorForm}      A form object
         */
        json(data) {
            return new PresenceSimulatorForm(data.id, data.enabled, data.excludeDevices);
        }
    }

    api.configurationAPI.register(PresenceSimulatorForm);

    /**
     * This class manage presence simulator extension
     * @class
     */
    class PresenceSimulator {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The api
         * @returns {PresenceSimulator}     The instance
         */
        constructor(api) {
            this.api = api;
            this.currentHourSchedule = [];
            this.schedule();
            this.api.timeEventAPI.register((self) => {
                const roundedCurrentTimestamp = DateUtils.class.roundedTimestamp(DateUtils.class.timestamp(), DateUtils.ROUND_TIMESTAMP_MINUTE);
                const configuration = self.api.configurationAPI.getConfiguration();
                self.currentHourSchedule.forEach((scheduledElement) => {
                    if (configuration && configuration.enabled === "on" && roundedCurrentTimestamp === scheduledElement.scheduleTimestamp && self.api.alarmAPI.alarmStatus()) {
                        self.api.deviceAPI.switchDevice(scheduledElement.device.identifier, scheduledElement.device.status, scheduledElement.device.brightness, scheduledElement.device.color, scheduledElement.device.colorTemperature);
                    }
                });

            }, this, this.api.timeEventAPI.constants().EVERY_MINUTES);

            this.api.timeEventAPI.register((self) => {
                self.schedule(self);
            }, this, this.api.timeEventAPI.constants().EVERY_HOURS);
        }

        /**
         * Schedule the device order in the future in the `currentHourSchedule` property
         *
         * @param  {PresenceSimulator} [context=null] The context
         */
        schedule(context = null) {
            if (!context) {
                context = this;
            }

            context.currentHourSchedule = [];

            const dbHelper = context.api.deviceAPI.getDbHelper();
            const timestamp = DateUtils.class.timestamp();
            const requestBuilder = dbHelper.RequestBuilder()
                .select("identifier", "status", "brightness", "temperature", "color")
                .selectOp(dbHelper.Operators().COUNT, dbHelper.Operators().FIELD_TIMESTAMP, "count")
                .where("strftime('%w', " + dbHelper.Operators().FIELD_TIMESTAMP + ")", dbHelper.Operators().EQ, "strftime('%w', datetime(" + timestamp + ", 'unixepoch'))") // Day of the week
                .where("strftime('%H', " + dbHelper.Operators().FIELD_TIMESTAMP + ")", dbHelper.Operators().EQ, "strftime('%H', datetime(" + timestamp + ", 'unixepoch'))") // Hour of the week
                .where("timestamp", dbHelper.Operators().GTE, (timestamp - (HISTORY_NB_MONTH * 30 * 24 * 60 * 60)))
                .group("identifier", "status")
                .order(dbHelper.Operators().DESC, "status");

            dbHelper.getObjects(requestBuilder, (error, devices) => {
                if (!error) {
                    // Compute percentage of call devices for this state
                    let totalCount = 0;
                    devices.forEach((device) => {
                        totalCount += device.count;
                    });
                    devices.sort((a,b) => (a.status < b.status) ? 1 : ((b.status < a.status) ? -1 : 0));
                    const planifiedOn = [];
                    devices.forEach((device) => {
                        const perc = Math.round((device.count / totalCount) * 100);
                        const random = Math.floor(Math.random() * Math.floor(RANDOM_MAX + perc));
                        let isExcluded = false;
                        const configuration = api.configurationAPI.getConfiguration();
                        if (configuration && configuration.excludeDevices && configuration.excludeDevices.length > 0) {
                            configuration.excludeDevices.forEach((excludeDevice) => {
                                if (excludeDevice.identifier === device.identifier) {
                                    isExcluded = true;
                                }
                            });
                        }

                        Logger.info(device.identifier + " / " + device.status + " / " + perc + " / " + random);

                        if ((perc >= PERCENTAGE_THRESHOLD || random >= RANDOM_THRESHOLD) && !isExcluded && device.status === api.deviceAPI.constants().INT_STATUS_ON) {
                            const scheduleTimestamp = DateUtils.class.roundedTimestamp(timestamp, DateUtils.ROUND_TIMESTAMP_HOUR) + ((Math.floor(Math.random() * Math.floor(60)) + 1) * 60);
                            Logger.info("Schedule " + device.identifier + " at " + scheduleTimestamp);
                            context.currentHourSchedule.push({scheduleTimestamp: scheduleTimestamp, device:device});
                            planifiedOn.push({scheduleTimestamp: scheduleTimestamp, device:device, tagged: false});
                        } else if (device.status === api.deviceAPI.constants().INT_STATUS_OFF) {
                            planifiedOn.forEach((planifiedElement) => {
                                if (planifiedElement.device.identifier === device.identifier) {
                                    const maxTs = DateUtils.class.roundedTimestamp(timestamp, DateUtils.ROUND_TIMESTAMP_HOUR) + (60 * 60) - 45;
                                    context.currentHourSchedule.push({scheduleTimestamp: maxTs, device:device});
                                    planifiedElement.tagged = true;
                                    Logger.info("Schedule " + device.identifier + " OFF at " + maxTs);
                                }
                            });
                        }
                    });
                } else {
                    Logger.err(error.message);
                }
            });
        }
    }

    api.registerInstance(new PresenceSimulator(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "presence-simulator",
    version: "0.0.0",
    category: "misc",
    description: "Presence Simulator plugin"
};
