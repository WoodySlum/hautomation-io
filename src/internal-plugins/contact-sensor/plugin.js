"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by throughput sensors
     * @class
     */
    class ContactSensorForm extends api.exported.SensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {ContactSensorForm}      An instance
         */
        json(data) {
            return new ContactSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(ContactSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class ContactSensor extends api.exported.Sensor {
        /**
         * Contact sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {ContactSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            super(api, id, "CONTACT", configuration, api.exported.Icons.icons["slider-window"], 0);
            this.chartType = api.exported.Sensor.constants().CHART_TYPE_BAR;
            this.aggregationMode = api.exported.Sensor.constants().AGGREGATION_MODE_LAST;
            this.unit = api.translateAPI.t("contact.unit.state");
            this.addClassifier(null, 0.99, 0);
            this.addClassifier(1, null, 1);
        }

        /**
         * Get the dashboard tile
         *
         * @param  {number} convertedValue            The converted value
         *
         * @returns {Tile}                  A tile
         */
        getTile(convertedValue) {
            return this.api.dashboardAPI.Tile("sensor-"+this.id, this.api.dashboardAPI.TileType().TILE_INFO_TWO_TEXT, ((convertedValue === 1) ? this.api.exported.Icons.class.list()["lock-open"] : this.api.exported.Icons.class.list()["lock"]), null, this.name, ((convertedValue === 1) ? this.api.translateAPI.t("contact.unit.state.open") : this.api.translateAPI.t("contact.unit.state.closed")), null, null, null, 800, "statistics");
        }

        /**
         * Update tile and register to dashboard
         *
         * @param  {Function} [cb=null] A callback without parameters when done. Used for testing only.
         */
        updateTile(cb = null) {
            this.lastObject((err, lastObject) => {
                if (!err && lastObject.value !== null) {
                    const tile = this.getTile(lastObject.value);

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
            });
        }
    }

    api.sensorAPI.registerClass(ContactSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "contact-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Contact sensor base plugin",
    dependencies:["sensor"]
};
