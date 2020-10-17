var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for one device
 * @class
 */
class DevicesListScenarioTriggerForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {number} [identifier=null] The device identifier
     * @param  {string} [status=null]     The status
     * @returns {DevicesListScenarioTriggerForm}                            The instance
     */
    constructor(id = null, identifier = null, status = null) {
        super(id);

        /**
         * @Property("identifier");
         * @Type("number");
         * @Title("devices.list.form.title");
         * @Enum("getDevicesId");
         * @EnumNames("getDevicesName");
         */
        this.identifier = identifier;

        /**
         * @Property("status");
         * @Type("string");
         * @Title("devices.list.form.status");
         * @Enum(["off", "on", "ignore", "open", "close", "stop"]);
         * @EnumNames(["devices.list.form.status.off", "devices.list.form.status.on", "devices.list.form.status.ignore", "devices.list.form.status.open", "devices.list.form.status.close", "devices.list.form.status.stop"]);
         */
        this.status = status;
    }

    /**
     * Form injection method for Devices name
     *
     * @param  {...Object} inject The modules list array
     * @returns {Array}        An array of devices name
     */
    static getDevicesName(...inject) {
        return inject[0];
    }

    /**
     * Form injection method for Devices ids
     *
     * @param  {...Object} inject The modules list array
     * @returns {Array}        An array of devices id
     */
    static getDevicesId(...inject) {
        return inject[1];
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {DevicesListScenarioTriggerForm}      A form object
     */
    json(data) {
        return new DevicesListScenarioTriggerForm(data.id, data.identifier, data.status);
    }
}

module.exports = {class:DevicesListScenarioTriggerForm};
