"use strict";
const TuyAPI = require("tuyapi");

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    api.init();

    /**
     * This class manage Tuya device form configuration
     * @class
     */
    class TuyaDeviceForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id The identifier
         * @param {string} tuyaId  The device identifier
         * @param {string} tuyaKey The device key
         * @param {string} tuyaIp  The device IP
         * @returns {TuyaDeviceForm}        The instance
         */
        constructor(id, tuyaId, tuyaKey, tuyaIp) {
            super(id);

            /**
             * @Property("tuyaId");
             * @Type("string");
             * @Title("tuya.device.id");
             * @Required(true);
             */
            this.tuyaId = tuyaId;

            /**
             * @Property("tuyaKey");
             * @Type("string");
             * @Title("tuya.device.key");
             * @Required(true);
             */
            this.tuyaKey = tuyaKey;

            /**
             * @Property("tuyaIp");
             * @Type("string");
             * @Title("tuya.device.ip");
             * @Required(true);
             * @Regexp("[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}");
             */
            this.tuyaIp = tuyaIp;
        }

        /**
         * Convert a json object to HueForm object
         *
         * @param  {Object} data Some data
         * @returns {TuyaDeviceForm}      An instance
         */
        json(data) {
            return new TuyaDeviceForm(data.id, data.tuyaId, data.tuyaKey, data.tuyaIp);
        }
    }

    /**
     * This class manage Tuya devices (outlets, ...)
     * @class
     */
    class TuyaDevice {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The core APIs
         * @returns {TuyaDevice}        The instance
         */
        constructor(api) {
            this.api = api;
            this.api.timeEventAPI.register((self) => {
                api.exported.Logger.verbose("Synchronizing tuya devices");
                self.updateLocalState(self);
            }, this, api.timeEventAPI.constants().EVERY_MINUTES);

            this.api.deviceAPI.addForm("tuyaDevice", TuyaDeviceForm, "tuya.form.title", true);
            this.api.deviceAPI.registerSwitchDevice("tuyaDevice", (device, formData, deviceStatus) => {
                if (formData && formData.length > 0) {
                    // let hasFailed = false;
                    for (let i = 0 ; i < formData.length ; i++) {
                        const tuyaConfig = formData[i];
                        if (tuyaConfig && tuyaConfig.tuyaId && tuyaConfig.tuyaKey && tuyaConfig.tuyaIp) {
                            const device = new TuyAPI({
                                id: tuyaConfig.tuyaId,
                                key: tuyaConfig.tuyaKey,
                                ip: tuyaConfig.tuyaIp});

                            device.set({set: ((deviceStatus.getStatus() === api.deviceAPI.constants().INT_STATUS_ON) ? true : false)}).then((success) => {
                                if (!success) {
                                    // hasFailed = true;
                                    api.exported.Logger.err("Tuya error");
                                }
                            }).catch((e) => {
                                // hasFailed = true;
                                api.exported.Logger.err("Tuya error : " + e.message);
                            });
                        } else {
                            api.exported.Logger.warn("Invalid configuration for tuya");
                        }
                    }

                    // if (hasFailed) {
                    //     if (deviceStatus.getStatus() === api.deviceAPI.constants().INT_STATUS_ON) {
                    //         deviceStatus.setStatus(api.deviceAPI.constants().INT_STATUS_OFF);
                    //     } else {
                    //         deviceStatus.setStatus(api.deviceAPI.constants().INT_STATUS_ON);
                    //     }
                    // }
                }

                return deviceStatus;
            });
        }

        /**
         * Update local devices status from Hue APIs
         *
         * @param  {TuyaDevice} [context=null] The context (`this`)
         */
        updateLocalState(context = null) {
            if (!context) {
                context = this;
            }

            context.api.deviceAPI.getDevices().forEach((device) => {
                if (device && device.TuyaDeviceForm) {
                    const promises = [];
                    for (let i = 0 ; i < device.TuyaDeviceForm.length ; i++) {
                        const tuyaDevice = new TuyAPI({id: device.TuyaDeviceForm[i].tuyaId, key: device.TuyaDeviceForm[i].tuyaKey, ip: device.TuyaDeviceForm[i].tuyaIp});
                        promises.push(tuyaDevice.get());
                    }

                    Promise.all(promises).then((statuses) => {
                        const currentDeviceStatus = device.status;
                        let isOn = context.api.deviceAPI.constants().INT_STATUS_OFF;
                        statuses.forEach((status) => {
                            if (status) {
                                isOn = context.api.deviceAPI.constants().INT_STATUS_ON;
                            }
                        });

                        if (currentDeviceStatus != isOn) {
                            device.status = isOn;
                        }

                        context.api.deviceAPI.saveDevice(device);
                    }).catch((e) => {
                        api.exported.Logger.warn("Communication issue with device " + device.name);
                        api.exported.Logger.warn(e.message);
                    });
                }
            });
        }
    }

    new TuyaDevice(api);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "tuya-device",
    version: "0.0.0",
    category: "device",
    description: "Tuya devices support (outlet, ...)",
    dependencies:[]
};
