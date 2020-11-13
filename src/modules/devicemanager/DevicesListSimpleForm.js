var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for one device
 * @class
 */
class DevicesListSimpleForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {number} [identifier=null] The device identifier
     *
     * @returns {DevicesListSimpleForm}                            The instance
     */
    constructor(id = null, identifier = null) {
        super(id);

        /**
         * @Property("identifier");
         * @Type("number");
         * @Title("devices.list.form.title");
         * @Enum("getDevicesId");
         * @EnumNames("getDevicesName");
         */
        this.identifier = identifier;
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
     * @returns {DevicesListSimpleForm}      A form object
     */
    json(data) {
        return new DevicesListSimpleForm(data.id, data.identifier);
    }
}

module.exports = {class:DevicesListSimpleForm};
