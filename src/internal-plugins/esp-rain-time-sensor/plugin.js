"use strict";
const MIN_VALUE_FOR_RAIN = 120;
const MIN_VALUE_FOR_HEAVY_RAIN = 800;

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * Esp humidity form sensor
     * @class
     */
    class EspRainTimeSensorForm extends api.exported.RainTimeSensorForm {

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {EspRainTimeSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.iotAppPowered();
    api.sensorAPI.registerForm(EspRainTimeSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class EspRainTimeSensor extends api.exported.RainTimeSensor {
        /**
         * ESP Rain time sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {EspRainTimeSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, configuration);
            this.lastSensorValue = null;
            this.lastSensorTimestamp = null;
        }

        /**
         * Set a value and store in database
         *
         * @param {number} value      A value
         * @param {number} [vcc=null] A voltage level
         * @param  {Function} [cb=null] A callback with an error parameter, called when done. Used for testing only.
         */
        setValue(value, vcc = null, cb = null) {
            this.lastSensorValue = value;
            this.lastSensorTimestamp = this.api.exported.DateUtils.class.timestamp();

            if (value >= MIN_VALUE_FOR_RAIN) {
                // it rains
                super.setValue(this.api.exported.EspWeatherStation.constants().REFRESH_TIME, vcc, cb, this.lastSensorTimestamp);
            } else {
                // no rains detected
                super.setValue(0, vcc, cb, this.lastSensorTimestamp);
            }
        }

        /**
         * Update tile and register to dashboard
         *
         * @param  {Function} [cb=null] A callback without parameters when done. Used for testing only.
         */
        updateTile(cb = null) {
            if (this.lastSensorValue && this.lastSensorTimestamp && this.lastSensorTimestamp > (this.api.exported.DateUtils.class.timestamp() - 60 * 60)) {
                let label = "n/a";
                if (this.lastSensorValue < MIN_VALUE_FOR_RAIN) {
                    label = this.api.translateAPI.t("esp.rain.time.sensor.no.rain");
                } else if (this.lastSensorValue < MIN_VALUE_FOR_HEAVY_RAIN) {
                    label = this.api.translateAPI.t("esp.rain.time.sensor.light.rain");
                } else {
                    label = this.api.translateAPI.t("esp.rain.time.sensor.heavy.rain");
                }
                const tile = this.api.dashboardAPI.Tile("sensor-"+this.id, this.api.dashboardAPI.TileType().TILE_INFO_TWO_TEXT, this.icon, null, this.name, label, null, null, null, 800, "statistics");
                if (this.configuration.dashboard) {
                    this.api.dashboardAPI.registerTile(tile);
                } else {
                    this.api.dashboardAPI.unregisterTile("sensor-"+this.id);
                }
                if (cb) cb();
            } else {
                this.lastObject((err, lastObject) => {
                    if (!err && lastObject.value > 0) {
                        const tile = this.api.dashboardAPI.Tile("sensor-"+this.id, this.api.dashboardAPI.TileType().TILE_INFO_TWO_TEXT, this.icon, null, this.name, this.api.translateAPI.t("esp.rain.time.sensor.it.rains"), null, null, null, 800, "statistics");
                        if (this.configuration.dashboardColor) {
                            tile.colors.colorDefault = this.configuration.dashboardColor;
                        }

                        if (this.configuration.dashboard) {
                            this.api.dashboardAPI.registerTile(tile);
                        } else {
                            this.api.dashboardAPI.unregisterTile("sensor-"+this.id);
                        }
                        if (cb) cb();
                    } else {
                        this.api.dashboardAPI.unregisterTile("sensor-"+this.id);
                        if (cb) cb();
                    }
                }, this.dashboardGranularity);
            }
        }
    }

    api.sensorAPI.registerClass(EspRainTimeSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "esp-rain-time-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "ESP rain time sensor",
    dependencies:["rain-time-sensor", "esp-weather-station-sensor"]
};
