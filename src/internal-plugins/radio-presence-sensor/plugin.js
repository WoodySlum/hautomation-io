"use strict";

const fs = require("fs-extra");

const LOCK_TIME = 5 * 60;
const MAX_HISTORY_LINES = 100000;
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
            api.radioAPI.register((radioObject) => {
                if (radioObject && configuration && configuration.radio && configuration.radio.length > 0) {
                    configuration.radio.forEach((radioConfiguration) => {
                        if (radioConfiguration.module === radioObject.module
                            && radioConfiguration.module === radioObject.module
                            && radioConfiguration.protocol === radioObject.protocol
                            && radioConfiguration.deviceId === radioObject.deviceId
                            && radioConfiguration.switchId === radioObject.switchId) {
                            const timestamp = api.exported.DateUtils.class.timestamp();
                            if (this.lastEmitted < (timestamp - LOCK_TIME)) {
                                this.setValue(LOCK_TIME);
                                this.lastEmitted = timestamp;
                            }
                        }
                    });
                }
            }, id);
        }

        /**
         * Needs to be call when sensor is ready
         */
        init() {
            super.init();
            this.registerBatteryAlert(this.api, this.configuration);
        }

        /**
         * Register alert battery
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         */
        registerBatteryAlert(api, configuration) {
            const mode = api.timeEventAPI.constants().EVERY_DAYS;
            api.timeEventAPI.unregister({}, mode, null, null, null, TMP_FILE_PREFIX + configuration.id);
            api.timeEventAPI.register(() => {
                if (configuration.alertOnBatteryLow === true) {
                    const sensorRadioConfigurations = configuration.radio;
                    api.radioAPI.getLastReceivedRadioInformations((radioObjects) => {
                        let found = false;
                        for (let i = 0 ; i < radioObjects.length ; i++) {
                            for (let j = 0 ; j < sensorRadioConfigurations.length ; j++) {
                                if (sensorRadioConfigurations[j].module.toLowerCase() === radioObjects[i].module.toLowerCase()
                                    && sensorRadioConfigurations[j].protocol.toLowerCase() === radioObjects[i].protocol.toLowerCase()
                                    && sensorRadioConfigurations[j].deviceId.toLowerCase() === radioObjects[i].deviceId.toLowerCase()
                                    && sensorRadioConfigurations[j].switchId.toLowerCase() === radioObjects[i].switchId.toLowerCase()) {
                                    found = true;
                                }
                            }
                        }

                        if (!found) {
                            const fileName = api.coreAPI.cachePath() + TMP_FILE_PREFIX + configuration.id;
                            if (!fs.existsSync(fileName)) {
                                fs.writeFileSync(fileName, "");
                                api.exported.Logger.info(api.translateAPI.t("radio.presence.sensor.alert.on.battery.low.message", configuration.name));
                                api.messageAPI.sendMessage("*", api.translateAPI.t("radio.presence.sensor.alert.on.battery.low.message", configuration.name));
                            }
                        }
                    }, MAX_HISTORY_LINES);
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
