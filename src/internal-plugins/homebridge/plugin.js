"use strict";
const HomebridgeServiceClass = require("./service.js");

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    /**
    * This class is used for Homebridge form
    * @class
    */
    class HomebridgeForm extends api.exported.FormObject.class {
        /**
        * Constructor
        *
        * @param  {number} id           Identifier
        * @param  {string} alexaUsername       The Alexa username
        * @param  {string} alexaPassword       The Alexa password
        * @param  {boolean} displayHomekitTile       The tile value
        * @param  {boolean} clearHomebridgeCache       Clear cache
        * @param  {string}  homebridgeIdentifier       The homebridge identifier - auto filled
        * @returns {HomebridgeForm}              The instance
        */
        constructor(id, alexaUsername, alexaPassword, displayHomekitTile = true, clearHomebridgeCache = false, homebridgeIdentifier = null) {
            super(id);

            /**
            * @Property("alexaUsername");
            * @Type("string");
            * @Title("homebridge.alexa.username");
            */
            this.alexaUsername = alexaUsername;

            /**
            * @Property("alexaPassword");
            * @Type("string");
            * @Display("password");
            * @Title("homebridge.alexa.password");
            */
            this.alexaPassword = alexaPassword;

            /**
            * @Property("displayHomekitTile");
            * @Type("boolean");
            * @Default(true);
            * @Title("homebridge.tile.qr");
            */
            this.displayHomekitTile = displayHomekitTile;

            /**
            * @Property("clearHomebridgeCache");
            * @Type("boolean");
            * @Default(false);
            * @Title("homebridge.clear.cache");
            */
            this.clearHomebridgeCache = clearHomebridgeCache;

            /**
            * @Property("homebridgeIdentifier");
            * @Type("string");
            * @Hidden(true);
            */
            this.homebridgeIdentifier = homebridgeIdentifier;
        }

        /**
        * Convert json data
        *
        * @param  {Object} data Some key / value data
        * @returns {HomebridgeForm}      A form object
        */
        json(data) {
            return new HomebridgeForm(data.id, data.alexaUsername, data.alexaPassword, data.displayHomekitTile, data.clearHomebridgeCache, data.homebridgeIdentifier);
        }
    }

    api.configurationAPI.register(HomebridgeForm);

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
            this.alarm = [];
            this.generateHapDevices();
            this.generateHapSensors();
            this.generateHapAlarm();

            if (!process.env.TEST) {
                this.service = new HomebridgeService(api, this.devices, this.sensors);
                api.servicesManagerAPI.add(this.service);

                api.coreAPI.registerEvent(api.deviceAPI.constants().EVENT_UPDATE_CONFIG_DEVICES, () => {
                    this.service.stop();
                    this.generateHapDevices();
                    this.service.init(this.devices, this.sensors);
                    this.service.start();
                });

                api.coreAPI.registerEvent(api.constants().CORE_EVENT_READY, () => {
                    this.service.stop();
                    this.generateHapSensors();
                    this.generateHapAlarm();
                    this.service.init(this.devices, this.sensors, this.alarm);
                    this.service.start();
                });

                api.configurationAPI.setUpdateCb((conf) => {
                    this.service.stop();
                    if (conf.clearHomebridgeCache) {
                        this.service.clearCache();
                        conf.clearHomebridgeCache = false;
                        conf.homebridgeIdentifier = null;
                        api.configurationAPI.saveData(conf);
                    }
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
            this.devicesName = [];
            this.api.deviceAPI.getDevices().forEach((device) => {
                if (device.visible) {
                    let i = 2;
                    if (device.bestDeviceType == this.api.deviceAPI.constants().DEVICE_TYPE_LIGHT_DIMMABLE_COLOR || device.bestDeviceType == this.api.deviceAPI.constants().DEVICE_TYPE_LIGHT_DIMMABLE || device.bestDeviceType == this.api.deviceAPI.constants().DEVICE_TYPE_LIGHT) {
                        let name = device.name;
                        if (this.devicesName.indexOf(name) >= 0) {
                            name = name + " " + i;
                            i++;
                        } else {
                            this.devicesName.push(name);
                        }
                        this.devices.push({
                            accessory: "Smarties lights",
                            identifier: device.id,
                            name: name,
                            coreApi:api,
                            status: device.status,
                            device: device
                        });
                    }
                }
            });
        }

        /**
         * Generate alarm config
         */
        generateHapAlarm() {
            this.alarm = [];
            this.alarm.push({
                accessory: "Smarties alarm",
                name: api.translateAPI.t("alarm.tile.title"),
                coreApi:api
            });
        }

        /**
         * Generate lights config
         */
        generateHapSensors() {
            this.sensors = [];
            this.sensorsName = [];
            let i = 2;
            const temperatureSensors = this.api.sensorAPI.getSensors("TEMPERATURE");
            Object.keys(temperatureSensors).forEach((sensorKey) => {

                let sensor = temperatureSensors[sensorKey];
                if (this.sensorsName.indexOf(sensor) >= 0) {
                    sensor = sensor + " " + i;
                    i++;
                } else {
                    this.sensorsName.push(sensor);
                }

                this.sensors.push({
                    accessory: "Smarties temperature sensor",
                    identifier: sensorKey,
                    name: sensor,
                    coreApi:api
                });
            });

            const humiditySensors = this.api.sensorAPI.getSensors("HUMIDITY");
            Object.keys(humiditySensors).forEach((sensorKey) => {

                let sensor = humiditySensors[sensorKey];
                if (this.sensorsName.indexOf(sensor) >= 0) {
                    sensor = sensor + " " + i;
                    i++;
                } else {
                    this.sensorsName.push(sensor);
                }

                this.sensors.push({
                    accessory: "Smarties humidity sensor",
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
    description: "Manage through Apple's HomeKit, Siri and Amazon Alexa",
    dependencies:[],
    classes:[]
};
