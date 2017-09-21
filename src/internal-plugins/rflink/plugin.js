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
     * This class manage RFLink form configuration
     * @class
     */
    class RFlinkForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id The identifier
         * @param  {string} port The port
         * @returns {RFlinkForm}        The instance
         */
        constructor(id, port) {
            super(id);
            /**
             * @Property("port");
             * @Type("string");
             * @Title("rflink.settings.port");
             * @Enum("getPorts");
             * @EnumNames("getPorts");
             */
            this.port = port;
        }

        /**
         * Form injection method for ports
         *
         * @param  {...Object} inject The ports list array
         * @returns {Array}        An array of ports
         */
        static getPorts(...inject) {
            return inject[0];
        }

        /**
         * Convert a json object to RFLinkForm object
         *
         * @param  {Object} data Some data
         * @returns {RFlinkForm}      An instance
         */
        json(data) {
            return new RFlinkForm(data.id, data.port);
        }
    }

    // Register the rflink form
    api.configurationAPI.register(RFlinkForm, []);

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
            if (api.configurationAPI.getConfiguration() && api.configurationAPI.getConfiguration().port) {
                this.service.port = api.configurationAPI.getConfiguration().port;
            }

            api.configurationAPI.setUpdateCb((data) => {
                if (data && data.port) {
                    this.service.port = data.port;
                    this.service.restart();
                }
            });
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
            switch (parseInt(status)) {
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
         * Callback when port data is received
         *
         * @param  {Object} data A data object containing serial ports
         */
        onDetectedPortsReceive(data) {
            const ports  = [];
            data.forEach((d) => {
                if (d.manufacturer && (d.manufacturer.toLowerCase().indexOf("arduino") !== -1)) {
                    ports.push(d.endpoint);
                }
            });

            // Register the rflink form
            api.configurationAPI.register(RFlinkForm, ports);
        }

       /**
        * Emit radio request
        *
        * @param  {number} frequency The frequency
        * @param  {string} protocol  The protocol
        * @param  {string} deviceId  The device ID
        * @param  {string} switchId  The switch ID
        * @param  {number} [status=null]    The status (or enum called through `constants()`)
        * @param  {number} [previousStatus=null]    The previous object status, used if status is null to invert
        * @returns {DbRadio}           A radio  object
        */
        emit(frequency, protocol, deviceId, switchId, status = null, previousStatus = null) {
            const radioObject = super.emit(frequency, protocol, deviceId, switchId, status, previousStatus);
            this.service.send("rflinkSend", this.formatRadioObjectBeforeSending(radioObject));
            return radioObject;
        }

        /**
         * Return the list of supported protocolList
         *
         * @param  {Function} cb A callback function `(err, protocols) => {}`
         */
        getProtocolList(cb) {
            const baseList = ["X10","AB400D","Chuango","newkaku","ev1527","elrodb","blyss","aster","warema","selectplus","kaku","tristate","ab400d","no1527","conrad","nodo_ra1527","doorbell","fa500","nodo_radiofrev1527","astrell","nodo_radi","e7","56e82","e=004041","nodo_rv1527"];
            super.getProtocolList((err, list) => {
                if (!err) {
                    list.forEach((protocol) => {
                        if (baseList.indexOf(protocol) === -1) {
                            baseList.push(protocol);
                        }
                    });
                }
                cb(null, baseList);
            });
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
