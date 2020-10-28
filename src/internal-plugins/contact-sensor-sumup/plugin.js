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
                            // Credits : Freepik / https://www.flaticon.com/free-icon/opened-door-aperture_59805
                            const svgDoorOpened = "<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"	 width=\"492.5px\" height=\"492.5px\" viewBox=\"0 0 492.5 492.5\" style=\"enable-background:new 0 0 492.5 492.5;\" xml:space=\"preserve\"	><g><path d=\"M184.646,0v21.72H99.704v433.358h31.403V53.123h53.539V492.5l208.15-37.422v-61.235V37.5L184.646,0z M222.938,263.129		c-6.997,0-12.67-7.381-12.67-16.486c0-9.104,5.673-16.485,12.67-16.485s12.67,7.381,12.67,16.485		C235.608,255.748,229.935,263.129,222.938,263.129z\"/></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>";
                            // Credits : Freepik / https://www.flaticon.com/free-icon/closed-door-with-border-silhouette_32533
                            const svgDoorClosed = "<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"	 width=\"435.789px\" height=\"435.789px\" viewBox=\"0 0 435.789 435.789\" style=\"enable-background:new 0 0 435.789 435.789;\"	 xml:space=\"preserve\"><g>	<path d=\"M369.21,435.789c-6.68,0-12.105-5.426-12.105-12.104V24.21H78.684v399.474c0,6.679-5.423,12.104-12.105,12.104		c-6.682,0-12.105-5.426-12.105-12.104V12.105C54.474,5.423,59.897,0,66.579,0H369.21c6.679,0,12.104,5.423,12.104,12.105v411.579		C381.315,430.363,375.889,435.789,369.21,435.789z M341.973,45.395v378.289H93.816V45.395H341.973z M154.342,237.565		c0-10.863-7.451-19.67-16.645-19.67c-9.194,0-16.645,8.807-16.645,19.67c0,10.864,7.451,19.672,16.645,19.672		C146.891,257.237,154.342,248.429,154.342,237.565z\"/></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>";
                            tiles.push({icon: rooms[room].open ? svgDoorOpened : svgDoorClosed, text: room, colorDefault: (rooms[room].open ? context.api.themeAPI.constants().OFF_COLOR_KEY : context.api.themeAPI.constants().ON_COLOR_KEY)});
                        });

                        const tile = context.api.dashboardAPI.Tile("contact-sensor-sumup", context.api.dashboardAPI.TileType().TILE_SUB_TILES, null, null, null, null, null, null, 0, 700, null, tiles, context.api.webAPI.Authentication().AUTH_USAGE_LEVEL);

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
    defaultDisabled: true,
    description: "Shows a contact sensor sumup tile",
    dependencies:["contact-sensor"]
};
