"use strict";
const HomebridgeServiceClass = require("./service.js");

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    const HomebridgeService = HomebridgeServiceClass(api);
    /**
     * Class for Homebridge
     * @class
     */
    class Homebridge {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @returns {Homebridge}                                                       The instance
         */
        constructor(api) {
            this.api = api;
            this.devices = [];
            this.sensors = [];
            this.generateHapDevices();
            this.generateHapSensors();

            if (!process.env.TEST) {
                this.service = new HomebridgeService(api, this.devices, this.sensors);
                api.servicesManagerAPI.add(this.service);

                api.coreAPI.registerEvent(api.deviceAPI.constants().EVENT_UPDATE_CONFIG_DEVICES, () => {
                    this.service.stop();
                    this.generateHapDevices();
                    this.service.init(this.devices, this.sensors);
                    this.service.start();
                });


                api.coreAPI.registerEvent(api.sensorAPI.constants().EVENT_SENSORS_READY, () => {
                    this.service.stop();
                    this.generateHapSensors();
                    this.service.init(this.devices, this.sensors);
                    this.service.start();
                });
            }
        }

        /**
         * Generate lights config
         */
        generateHapDevices() {
            this.devices = [];
            this.api.deviceAPI.getDevices().forEach((device) => {
                if (device.visible) {
                    this.devices.push({
                        accessory: "Hautomation lights",
                        identifier: device.id,
                        name: device.name,
                        coreApi:api,
                        status: device.status
                    });
                }
            });
        }

        /**
         * Generate lights config
         */
        generateHapSensors() {
            this.sensors = [];
            const temperatureSensors = this.api.sensorAPI.getSensors("TEMPERATURE");
            Object.keys(temperatureSensors).forEach((sensorKey) => {
                this.sensors.push({
                    accessory: "Hautomation temperature sensor",
                    identifier: sensorKey,
                    name: temperatureSensors[sensorKey],
                    coreApi:api
                });
            });

            const humiditySensors = this.api.sensorAPI.getSensors("HUMIDITY");
            Object.keys(humiditySensors).forEach((sensorKey) => {
                this.sensors.push({
                    accessory: "Hautomation humidity sensor",
                    identifier: sensorKey,
                    name: humiditySensors[sensorKey],
                    coreApi:api
                });
            });
        }
    }

    api.registerInstance(new Homebridge(api));
    api.init();
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "homebridge",
    version: "0.0.0",
    category: "bridge",
    description: "Manage through Apple's Siri and HomeKit",
    dependencies:["sensor", "temperature-sensor", "humidity-sensor", "openweather-temperature-sensor", "esp-temperature-sensor"],
    classes:[]
};
