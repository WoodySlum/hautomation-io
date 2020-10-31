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
                            // Credits : Dreamstale / https://www.flaticon.com/premium-icon/open-door_513314
                            const svgDoorOpened = "<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"	 viewBox=\"0 0 512 512\" style=\"enable-background:new 0 0 512 512;\" xml:space=\"preserve\"><g>	<g>		<g>			<path d=\"M298.667,298.667c17.643,0,32-14.357,32-32c0-17.643-14.357-32-32-32c-17.643,0-32,14.357-32,32				C266.667,284.309,281.024,298.667,298.667,298.667z M298.667,256c5.867,0,10.667,4.779,10.667,10.667s-4.8,10.667-10.667,10.667				c-5.867,0-10.667-4.779-10.667-10.667S292.8,256,298.667,256z\"/>			<path d=\"M448,490.667h-32v-480C416,4.779,411.221,0,405.333,0H106.667c-0.597,0-1.131,0.256-1.707,0.341				c-0.555,0.085-1.088,0.149-1.621,0.32c-0.939,0.32-1.749,0.789-2.56,1.344c-0.32,0.213-0.704,0.277-1.003,0.533				c-0.107,0.085-0.149,0.213-0.256,0.32c-0.768,0.704-1.365,1.579-1.899,2.496c-0.213,0.341-0.512,0.619-0.661,0.981				C96.363,7.68,96,9.109,96,10.667v480H64c-5.888,0-10.667,4.779-10.667,10.667C53.333,507.221,58.112,512,64,512h42.667				c0.576,0,1.173-0.043,1.749-0.149l256-42.667c5.141-0.853,8.917-5.312,8.917-10.517V53.333c0-5.227-3.776-9.664-8.917-10.517				L235.541,21.333h159.125v480c0,5.888,4.779,10.667,10.667,10.667H448c5.888,0,10.667-4.779,10.667-10.667				C458.667,495.445,453.888,490.667,448,490.667z M352,62.357v387.264l-234.667,39.125V23.253L352,62.357z\"/>		</g>	</g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>";
                            // Credits : Dreamstale / https://www.flaticon.com/premium-icon/door_513288
                            const svgDoorClosed = "<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"	 viewBox=\"0 0 512 512\" style=\"enable-background:new 0 0 512 512;\" xml:space=\"preserve\"><g>	<g>		<g>			<path d=\"M448,490.667h-32v-480C416,4.779,411.221,0,405.333,0H106.667C100.779,0,96,4.779,96,10.667v480H64				c-5.888,0-10.667,4.779-10.667,10.667C53.333,507.221,58.112,512,64,512h384c5.888,0,10.667-4.779,10.667-10.667				C458.667,495.445,453.888,490.667,448,490.667z M394.667,490.667H117.333V21.333h277.333V490.667z\"/>			<path d=\"M341.333,277.333c17.643,0,32-14.357,32-32c0-17.643-14.357-32-32-32c-17.643,0-32,14.357-32,32				C309.333,262.976,323.691,277.333,341.333,277.333z M341.333,234.667c5.888,0,10.667,4.779,10.667,10.667				S347.221,256,341.333,256s-10.667-4.779-10.667-10.667S335.445,234.667,341.333,234.667z\"/>		</g>	</g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>";
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
