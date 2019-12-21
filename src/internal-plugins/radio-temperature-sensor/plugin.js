"use strict";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * Radio temperature form sensor
     * @class
     */
    class RadioTemperatureSensorForm extends api.exported.TemperatureSensorForm {
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
         * @returns {RadioTemperatureSensorForm}                 The instance
         */
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor, radio, alertOnBatteryLow) {
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
         * @returns {RadioTemperatureSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(RadioTemperatureSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class RadioTemperatureSensor extends api.exported.TemperatureSensor {
        /**
         * Radio light sensor class
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {RadioTemperatureSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            api.radioAPI.register((radioObject) => {
                if (radioObject && configuration && configuration.radio && configuration.radio.length > 0) {
                    configuration.radio.forEach((radioConfiguration) => {
                        if (radioConfiguration.module.toString() === radioObject.module.toString()
                            && radioConfiguration.protocol.toString() === radioObject.protocol.toString()
                            && radioConfiguration.deviceId.toString() === radioObject.deviceId.toString()
                            && radioConfiguration.switchId.toString() === radioObject.switchId.toString()) {
                            if (radioObject.sensorType) {
                                if (radioObject.sensorType === this.type) {
                                    this.setValue(parseFloat(radioObject.value));
                                }
                            } else {
                                this.setValue(parseFloat(radioObject.value));
                            }
                        }
                    });
                }
            }, id);
        }
    }

    api.sensorAPI.registerClass(RadioTemperatureSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "radio-temperature-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Radio temperature sensor",
    dependencies:["temperature-sensor"]
};
