/* eslint-disable */
"use strict";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class manage tv philips form configuration
     * @class
     */
    class SensorSumupForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id The identifier
         * @param  {Array} sensors Sensors
         * @returns {SensorSumupForm}        The instance
         */
        constructor(id, sensors) {
            super(id);

            /**
             * @Property("sensors");
             * @Type("objects");
             * @Cl("SensorsListForm");
             */
            this.sensors = sensors;
        }


        /**
         * Convert a json object to SensorSumupForm object
         *
         * @param  {Object} data Some data
         * @returns {SensorSumupForm}      An instance
         */
        json(data) {
            return new SensorSumupForm(data.id, data.sensors);
        }
    }

    // Register the form
    api.configurationAPI.register(SensorSumupForm);

    /**
     * This class is used for sumup sensors
     * @class
     */
    class SensorSumup {
        /**
         * Constructor
         *
         * @param {PluginAPI} api          The API
         */
        constructor(api) {
            this.api = api;
            const self = this;
            this.api.coreAPI.registerEvent(api.constants().CORE_EVENT_READY, () => {
                self.registerTile(self);
            });

            this.api.configurationAPI.setUpdateCb(() => {
                self.registerTile(self);
            });

            this.api.sensorAPI.registerSensorEvent((id) => {
                const configuration = self.api.configurationAPI.getConfiguration();
                if (configuration && configuration.sensors && configuration.sensors.length > 0) {
                    configuration.sensors.forEach((sensorElement) => {
                        if (sensorElement.identifier.toString() === id.toString()) {
                            self.registerTile(self);
                        }
                    });
                } else {
                    self.api.dashboardAPI.unregisterTile("sensor-sumup");
                }

            }, "*", "*");
        }

        /**
         * Register tile
         *
         * @param  {SensorSumup} [context=null] This instance
         */
        registerTile(context = null) {
            if (!context) {
                context = this;
            }

            const configuration = context.api.configurationAPI.getConfiguration();
            const datas = [];
            if (configuration && configuration.sensors && configuration.sensors.length > 0) {
                let i = 0;
                configuration.sensors.forEach((sensorElement) => {
                    const sensorData = {sensor:context.api.sensorAPI.getSensor(sensorElement.identifier)};
                    if (sensorData.sensor) {
                        sensorData.sensor.lastObject((err, res) => {
                            i++;
                            if (res) {
                                sensorData.convertValue = sensorData.sensor.convertValue(res.value);
                                datas.push(sensorData);
                            }

                            if (i === configuration.sensors.length) {
                                datas.sort((a,b) => {
                                    var o1 = a.sensor.type.toLowerCase();
                                    var o2 = b.sensor.type.toLowerCase();

                                    var p1 = a.sensor.id.toString().toLowerCase();
                                    var p2 = b.sensor.id.toString().toLowerCase();

                                    if (o1 < o2) return -1;
                                    if (o1 > o2) return 1;
                                    if (p1 < p2) return -1;
                                    if (p1 > p2) return 1;

                                    return 0;
                                });
                                const tiles = [];
                                datas.forEach((data) => {
                                    tiles.push({icon: data.sensor.icon, text: (data.convertValue.value + " " + data.convertValue.unit), colorDefault: context.api.themeAPI.constants().SECONDARY_COLOR_KEY});
                                });

                                const tile = context.api.dashboardAPI.Tile("sensor-sumup", context.api.dashboardAPI.TileType().TILE_SUB_TILES, null, null, null, null, null, null, 0, 720, "statistics", tiles, context.api.webAPI.Authentication().AUTH_USAGE_LEVEL);
                                context.api.dashboardAPI.unregisterTile("sensor-sumup");
                                context.api.dashboardAPI.registerTile(tile);
                            }
                        });
                    } else {
                        i++;
                    }

                });
            }

        }
    }

    const sensorSumup = new SensorSumup(api);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "sensor-sumup",
    version: "0.0.0",
    category: "misc",
    description: "Sensor sumup",
    defaultDisabled: true,
    classes:[]
};
