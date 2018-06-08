"use strict";
const fs = require("fs-extra");
const platform = require("os").platform();
const homebridge = require("homebridge");
const HomebridgeServiceClass = require("./service.js");

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    const HomebridgeService = HomebridgeServiceClass(api);

    class Homebridge {
        constructor(api) {
            this.api = api;
            this.devices = [];
            this.generateHapDevices();
            this.service = new HomebridgeService(api, this.devices);
            api.servicesManagerAPI.add(this.service);

        }

        generateHapDevices() {
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
    dependencies:[],
    classes:[]
};
