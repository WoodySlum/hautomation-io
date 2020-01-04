"use strict";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class manage water plant alert extension
     * @class
     */
    class ContactSensorSumup {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The api
         * @returns {ContactSensorSumup}     The instance
         */
        constructor(api) {
            this.api = api;
            const self = this;
            this.api.coreAPI.registerEvent(api.constants().CORE_EVENT_READY, () => {
                self.registerTile(self);
            });

            this.api.coreAPI.registerEvent("room-update", () => {
                self.registerTile(self);
            });

            this.api.sensorAPI.registerSensorEvent(() => {
                self.registerTile(self);
            }, "*", "CONTACT");
        }

        /**
         * Register tile
         *
         * @param  {ContactSensorSumup} [context=null] This instance
         */
        registerTile(context = null) {
            if (!context) {
                context = null;
            }

            let sensors = [];
            let sensorsConfiguration = {};
            Object.keys(context.api.sensorAPI.getSensors()).forEach((sensorKey) => {
                const sensor = context.api.sensorAPI.getSensor(sensorKey);
                if (sensor.type === "CONTACT") {
                    sensors.push(sensor);
                    sensorsConfiguration[sensor.id] = sensor.configuration;
                }
            });

            let i = 0;
            const rooms = {};
            sensors.forEach((sensor) => {
                sensor.lastObject((err, res) => {
                    i++;
                    if (!err && res) {
                        const room = (sensorsConfiguration[res.sensorId] && sensorsConfiguration[res.sensorId].room && sensorsConfiguration[res.sensorId].room.room && sensorsConfiguration[res.sensorId].room.room.length > 0) ? sensorsConfiguration[res.sensorId].room.room : sensorsConfiguration[res.sensorId].name;

                        if (rooms[room]) {
                            if (!rooms[room].open && res.value > 0) {
                                rooms[room].open = true;
                            }
                        } else {
                            rooms[room] = {open: (res.value > 0 ? true : false)};
                        }
                    }

                    if (i === sensors.length) {
                        const tiles = [];
                        Object.keys(rooms).forEach((room) => {
                            tiles.push({icon: (rooms[room].open ? context.api.exported.Icons.class.list()["lock-open"] : context.api.exported.Icons.class.list()["lock"]), text: room, colorDefault: (rooms[room].open ? context.api.themeAPI.constants().OFF_COLOR_KEY : context.api.themeAPI.constants().ON_COLOR_KEY)});
                        });
                        const tile = context.api.dashboardAPI.Tile("contact-sensor-sumup", context.api.dashboardAPI.TileType().TILE_SUB_TILES, null, null, null, null, null, null, 0, 0, null, tiles, context.api.webAPI.Authentication().AUTH_USAGE_LEVEL);
                        context.api.dashboardAPI.unregisterTile("contact-sensor-sumup");
                        context.api.dashboardAPI.registerTile(tile);
                    }
                });
            });
        }
    }

    api.registerInstance(new ContactSensorSumup(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "contact-sensor-sumup",
    version: "0.0.0",
    category: "misc",
    defaultDisabled: false,
    description: "Shows a contact sensor sumup tile",
    dependencies:["contact-sensor"]
};
