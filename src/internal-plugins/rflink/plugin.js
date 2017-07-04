/* eslint-disable */
"use strict";
const RFLinkServiceClass = require("./service.js");

function loaded(api) {
    api.init();

    /**
     * This class is a RFLink plugin
     * @class
     */
    class RFLink extends api.exported.Radio {
        constructor(api) {
            super(api, "rflink");
            this.api = api;
            const RFLinkService = RFLinkServiceClass(api);
            this.service = new RFLinkService(this);
            api.servicesManagerAPI.add(this.service);
        }

        rflinkStatusToRadioStatus(rflinkStatus) {
            switch (rflinkStatus) {
                case "ON":
                    return this.constants().STATUS_ON;
                    break;
                case "OFF":
                    return this.constants().STATUS_OFF;
                    break;
                case "ALLON":
                    return this.constants().STATUS_ALL_ON;
                    break;
                case "ALLOFF":
                    return this.constants().STATUS_ALL_OFF;
                    break;
                default:
                    return this.constants().STATUS_ON;
                    break;
            }
        }

        radioStatusToRflinkStatus(rflinkStatus) {
            switch (rflinkStatus) {
                case this.constants().STATUS_ON:
                    return "ON";
                    break;
                case this.constants().STATUS_OFF:
                    return "OFF";
                    break;
                case this.constants().STATUS_ALL_ON:
                    return "ALLON";
                    break;
                case this.constants().STATUS_ALL_OFF:
                    return "ALLOFF";
                    break;
                default:
                    this.constants().STATUS_ON;
                    break;
            }
        }

        formatRadioObjectBeforeSending(radioObject) {
            return "10;" + radioObject.protocol + ";" + radioObject.deviceId + ";" + radioObject.switchId + ";" + this.radioStatusToRflinkStatus(radioObject.status) + ";";
        }

        onRflinkReceive(data) {
            // TODO: Support values and sensors
            const dbObject = this.save("433.92", data.protocol, data.code, data.subcode, null, this.rflinkStatusToRadioStatus(data.status));
        }

        onRadioTrigger(radioObject) {
            super.onRadioTrigger(radioObject);
            this.service.send("rflinkSend", this.formatRadioObjectBeforeSending(radioObject));
        }
    }

    // Instantiate
    let rflink = new RFLink(api);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "rflink",
    version: "0.0.0",
    category: "radio",
    description: "Manage RFLink devices",
    dependencies:["radio"],
    classes:[]
};
