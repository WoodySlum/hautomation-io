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
            // Credits : winnievinzence / https://www.flaticon.com/premium-icon/sliding-doors_2401100
            const svg = "<svg height=\"512\" viewBox=\"0 0 64 64\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><g id=\"slider_window\" data-name=\"slider window\"><path d=\"m63 0h-62a1 1 0 0 0 -1 1v62a1 1 0 0 0 1 1h62a1 1 0 0 0 1-1v-62a1 1 0 0 0 -1-1zm-1 62h-60v-60h60z\"/><path d=\"m4 61h26a1 1 0 0 0 1-1v-56a1 1 0 0 0 -1-1h-26a1 1 0 0 0 -1 1v56a1 1 0 0 0 1 1zm1-56h24v54h-24z\"/><path d=\"m34 61h26a1 1 0 0 0 1-1v-56a1 1 0 0 0 -1-1h-26a1 1 0 0 0 -1 1v56a1 1 0 0 0 1 1zm1-56h24v54h-24z\"/><path d=\"m4.272 31h25.456v2h-25.456z\" transform=\"matrix(.707 -.707 .707 .707 -17.648 21.393)\"/><path d=\"m11.136 36.5h12.728v2h-12.728z\" transform=\"matrix(.707 -.707 .707 .707 -21.391 23.358)\"/><path d=\"m8.929 26h14.142v2h-14.142z\" transform=\"matrix(.707 -.707 .707 .707 -14.406 19.222)\"/><path d=\"m34.272 31h25.456v2h-25.456z\" transform=\"matrix(.707 -.707 .707 .707 -8.861 42.607)\"/><path d=\"m41.136 36.5h12.728v2h-12.728z\" transform=\"matrix(.707 -.707 .707 .707 -12.604 44.571)\"/><path d=\"m38.929 26h14.142v2h-14.142z\" transform=\"matrix(.707 -.707 .707 .707 -5.619 40.435)\"/></g></svg>";
            super(api, id, "CONTACT", configuration, svg, 0);
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
