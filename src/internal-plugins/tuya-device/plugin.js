"use strict";
const TuyAPI = require("tuyapi");
const DELTA_RETRIEVAL = 5;// In seconds

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
             * @Type("object");
             * @Cl("IpScanForm");
             * @Required(true);
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
                        if (tuyaConfig && tuyaConfig.tuyaId && tuyaConfig.tuyaKey && tuyaConfig.tuyaIp && tuyaConfig.tuyaIp.ip) {
                            const device = new TuyAPI({
                                id: tuyaConfig.tuyaId,
                                key: tuyaConfig.tuyaKey,
                                ip: (tuyaConfig.tuyaIp.ip === "freetext") ? tuyaConfig.tuyaIp.freetext : tuyaConfig.tuyaIp.ip});

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
            const listUpdate = {};
            const promises = [];
            context.api.deviceAPI.getDevices().forEach((device) => {
                if (device && device.TuyaDeviceForm) {
                    for (let i = 0 ; i < device.TuyaDeviceForm.length ; i++) {
                        if (device.TuyaDeviceForm[i] && device.TuyaDeviceForm[i].tuyaId && device.TuyaDeviceForm[i].tuyaKey && device.TuyaDeviceForm[i].tuyaIp && device.TuyaDeviceForm[i].tuyaIp.ip) {
                            if (listUpdate[device.TuyaDeviceForm[i].tuyaId]) {
                                listUpdate[device.TuyaDeviceForm[i].tuyaId].devices.push(device);
                            } else {
                                listUpdate[device.TuyaDeviceForm[i].tuyaId] = {
                                    devices:[device],
                                    formData:device.TuyaDeviceForm[i]
                                };
                            }
                        }
                    }
                }
            });

            let timeout = 0;
            Object.keys(listUpdate).forEach((listUpdateKey) => {
                const tuyaDevicePromise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        const tuya = new TuyAPI({id: listUpdate[listUpdateKey].formData.tuyaId, key: listUpdate[listUpdateKey].formData.tuyaKey, ip: (listUpdate[listUpdateKey].formData.tuyaIp.ip === "freetext") ? listUpdate[listUpdateKey].formData.tuyaIp.freetext : listUpdate[listUpdateKey].formData.tuyaIp.ip}).get();
                        tuya.then((r) => {
                            resolve(r);
                        })
                        .catch((e) => {
                            reject(e);
                        });
                    }, timeout * 1000);
                });

                promises.push(tuyaDevicePromise);
                timeout += DELTA_RETRIEVAL;
            });

            Promise.all(promises).then((statuses) => {
                if (statuses.length === Object.keys(listUpdate).length) {
                    let i = 0;
                    Object.keys(listUpdate).forEach((listUpdateKey) => {
                        const status = statuses[i];
                        if (typeof status == typeof true) {
                            // Update devices
                            listUpdate[listUpdateKey].devices.forEach((device) => {
                                const currentDeviceStatus = device.status;
                                let isOn = context.api.deviceAPI.constants().INT_STATUS_OFF;
                                if (status) {
                                    isOn = context.api.deviceAPI.constants().INT_STATUS_ON;
                                }

                                if (currentDeviceStatus != isOn) {
                                    device.status = isOn;
                                    context.api.deviceAPI.switchDeviceWithDevice(device);
                                }
                            });
                        }

                        i++;
                    });
                }
            }).catch((e) => {
                context.api.exported.Logger.warn(e.message);
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
