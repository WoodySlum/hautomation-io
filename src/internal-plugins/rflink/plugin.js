"use strict";
const RFLinkServiceClass = require("./service.js");

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    api.init();

    /**
     * This class manage RFLink
     * @class
     */
    class RFLink extends api.exported.Radio {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The core APIs
         * @returns {RFLink}        The instance
         */
        constructor(api) {
            super(api);
            this.api = api;
            const RFLinkService = RFLinkServiceClass(api);
            this.service = new RFLinkService(this);
            api.servicesManagerAPI.add(this.service);
        }

        /**
         * Convert RFLink radio status to hautomation radio statuses
         *
         * @param  {string} rflinkStatus RFLink status
         * @returns {number}              Hautomationr adio status
         */
        rflinkStatusToRadioStatus(rflinkStatus) {
            let status;
            switch (rflinkStatus) {
            case "ON":
                status = this.constants().STATUS_ON;
                break;
            case "OFF":
                status = this.constants().STATUS_OFF;
                break;
            case "ALLON":
                status = this.constants().STATUS_ALL_ON;
                break;
            case "ALLOFF":
                status = this.constants().STATUS_ALL_OFF;
                break;
            default:
                status = this.constants().STATUS_ON;
                break;
            }

            return status;
        }

        /**
         * Convert Hautomation radio status to reflink format
         *
         * @param  {number} status Hautomation radio status
         * @returns {string}              RFLink format status
         */
        radioStatusToRflinkStatus(status) {
            let rflinkStatus;
            switch (status) {
            case this.constants().STATUS_ON:
                rflinkStatus = "ON";
                break;
            case this.constants().STATUS_OFF:
                rflinkStatus = "OFF";
                break;
            case this.constants().STATUS_ALL_ON:
                rflinkStatus = "ALLON";
                break;
            case this.constants().STATUS_ALL_OFF:
                rflinkStatus = "ALLOFF";
                break;
            default:
                rflinkStatus = this.constants().STATUS_ON;
                break;
            }

            return rflinkStatus;
        }

        /**
         * Format a DBObject to RFLink serial format
         *
         * @param  {DbRadio} radioObject A radio object
         * @returns {string}             The RFLink formatted instruction
         */
        formatRadioObjectBeforeSending(radioObject) {
            return "10;" + radioObject.protocol + ";" + radioObject.deviceId + ";" + radioObject.switchId + ";" + this.radioStatusToRflinkStatus(radioObject.status) + ";";
        }

        /**
         * Callback when an information is received from rf link service thread
         *
         * @param  {Object} data A data object containing radio informations
         */
        onRflinkReceive(data) {
            // TODO: Support values and sensors
            super.onRadioEvent(this.defaultFrequency(), data.protocol, data.code, data.subcode, null, this.rflinkStatusToRadioStatus(data.status));
        }

        /**
         * Emit RFLink request
         *
         * @param  {number} frequency The frequency
         * @param  {string} protocol  The protocol
         * @param  {string} deviceId  The device ID
         * @param  {string} switchId  The switch ID
         * @param  {number} status    The status (or enum called through `constants()`
         * @returns {DbRadio}           A radio  object
         */
        emit(frequency, protocol, deviceId, switchId, status) {
            const radioObject = super.emit(frequency, protocol, deviceId, switchId, status);
            this.service.send("rflinkSend", this.formatRadioObjectBeforeSending(radioObject));
            return radioObject;
        }
    }

    // Instantiate. Parent will store instanciation.
    new RFLink(api);
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
