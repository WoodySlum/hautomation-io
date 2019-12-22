"use strict";

const fs = require("fs-extra");

const LOCK_TIME = 60;
const MAX_BATTERY_HISTORY_TIME = 30 * 24 * 60 * 60;
const TMP_FILE_PREFIX = "radio-presence-sensor-notification-sent-";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * Radio presence form sensor
     * @class
     */
    class RadioPresenceSensorForm extends api.exported.PresenceSensorForm {
        /**
         * Radio presence sensor form
         *
         * @param  {number} id              An identifier
         * @param  {string} plugin          A plugin
         * @param  {string} name            Sensor's name
         * @param  {boolean} dashboard       True if display on dashboard, otherwise false
         * @param  {boolean} statistics      True if display on statistics, otherwise false
         * @param  {string} dashboardColor  The dashboard color
         * @param  {string} statisticsColor The statistics color
         * @param  {Array} radio The radio objects
         * @param  {boolean} alertOnBatteryLow Alert when battery is low
         * @returns {RadioPresenceSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor, radio, alertOnBatteryLow = false) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);

            /**
             * @Property("radio");
             * @Type("objects");
             * @Cl("RadioForm");
             * @Title("device.form.radio");
             * @Default([]);
             */
            this.radio = radio;

            /**
             * @Property("alertOnBatteryLow");
             * @Type("boolean");
             * @Cl("RadioForm");
             * @Title("radio.presence.sensor.alert.on.battery.low");
             * @Default(true);
             */
            this.alertOnBatteryLow = alertOnBatteryLow;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {RadioPresenceSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(RadioPresenceSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class RadioPresenceSensor extends api.exported.PresenceSensor {
        /**
         * Radio presence sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {RadioPresenceSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            this.lastEmitted = 0;
            const self = this;
            api.exported.Radio.registerSensor(api, this, () => {
                const timestamp = api.exported.DateUtils.class.timestamp();
                if (self.lastEmitted < (timestamp - LOCK_TIME)) {
                    self.setValue(LOCK_TIME);
                    self.lastEmitted = timestamp;
                }
            });
        }

        /**
         * Needs to be call when sensor is ready
         */
        init() {
            super.init();
            this.registerBatteryAlert(this.api, this.configuration, this.dbHelper);
        }

        /**
         * Register alert battery
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @param  {DbHelper} dbHelper      A database helper object
         */
        registerBatteryAlert(api, configuration, dbHelper) {
            const mode = api.timeEventAPI.constants().EVERY_HOURS;
            api.timeEventAPI.unregister({}, mode, null, null, null, TMP_FILE_PREFIX + configuration.id);
            api.timeEventAPI.register(() => {
                if (configuration.alertOnBatteryLow === true) {
                    const request = dbHelper.RequestBuilder()
                        .selectOp(dbHelper.Operators().COUNT, dbHelper.Operators().FIELD_ID)
                        .where("sensorId", dbHelper.Operators().EQ, configuration.id)
                        .where(dbHelper.Operators().FIELD_TIMESTAMP, dbHelper.Operators().GTE, (api.exported.DateUtils.class.timestamp() - MAX_BATTERY_HISTORY_TIME));
                    dbHelper.getObjects(request, (error, objects) => {
                        if (!error && objects) {
                            const resultsCount = objects[0][dbHelper.Operators().FIELD_ID];
                            const fileName = api.coreAPI.cachePath() + TMP_FILE_PREFIX + configuration.id;
                            if (resultsCount === 0) {
                                if (!fs.existsSync(fileName)) {
                                    fs.writeFileSync(fileName, "");
                                    api.exported.Logger.info(api.translateAPI.t("radio.presence.sensor.alert.on.battery.low.message", configuration.name));
                                    api.messageAPI.sendMessage("*", api.translateAPI.t("radio.presence.sensor.alert.on.battery.low.message", configuration.name));
                                }
                            } else {
                                if (fs.existsSync(fileName)) {
                                    fs.unlinkSync(fileName);
                                    api.messageAPI.sendMessage("*", api.translateAPI.t("radio.presence.sensor.alert.on.battery.ok", configuration.name));
                                }
                            }
                        } else {
                            api.exported.Logger.err(error.message);
                        }
                    });
                }
            }, this, mode, null, null, null, TMP_FILE_PREFIX + configuration.id);
        }
    }

    api.sensorAPI.registerClass(RadioPresenceSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "radio-presence-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Radio presence sensor",
    dependencies:["presence-sensor"]
};
