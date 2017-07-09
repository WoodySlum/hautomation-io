var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a radio form part
 * @class
 */
class RadioForm  extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]       The id
     * @param  {string} [module=null]   The module
     * @param  {string} [protocol=null] The protocol
     * @param  {string} [deviceId=null] The device id
     * @param  {string} [switchId=null] The switch id
     * @returns {RadioForm}                 The instance
     */
    constructor(id = null, module = null, protocol = null, deviceId = null, switchId = null) {
        super(id);

        /**
         * @Property("module");
         * @Type("string");
         * @Title("radio.form.module");
         * @Enum("getModules");
         * @EnumNames("getModules");
         */
        this.module = module;

        /**
         * @Property("protocol");
         * @Type("string");
         * @Title("radio.form.protocol");
         * @Enum("getProtocols");
         * @EnumNames("getProtocols");
         */
        this.protocol = protocol;

        /**
         * @Property("deviceId");
         * @Type("string");
         * @Title("radio.form.deviceId");
         */
        this.deviceId = deviceId;

        /**
         * @Property("switchId");
         * @Type("string");
         * @Title("radio.form.switchId");
         */
        this.switchId = switchId;
    }

    /**
     * Form injection method for modules
     *
     * @param  {...Object} inject The modules list array
     * @returns {Array}        An array of modules
     */
    static getModules(...inject) {
        return inject[0];
    }

    /**
     * Form injection method for protocols
     *
     * @param  {...Object} inject The protocols list array
     * @returns {Array}        An array of protocols
     */
    static getProtocols(...inject) {
        return inject[1];
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {RadioForm}      A form object
     */
    json(data) {
        return new RadioForm(data.id, data.module, data.protocol, data.deviceId, data.switchId);
    }
}

module.exports = {class:RadioForm};
