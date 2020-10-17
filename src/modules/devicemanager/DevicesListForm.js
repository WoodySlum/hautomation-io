var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for one device
 * @class
 */
class DevicesListForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {number} [identifier=null] The device identifier
     * @param  {string} [status=null]     The status
     * @param {number} [brightness=1]    Brightness
     * @param {string} [color="FFFFFF"]  Color
     * @param {string} [colorTemperature=0]  Color temperature
     * @param {boolean} [keepParams=true]    Keep params existing
     * @param {number} [updateBrightness=1]    Update brightness
     * @returns {DevicesListForm}                            The instance
     */
    constructor(id = null, identifier = null, status = null, brightness = 1, color = "FFFFFF", colorTemperature = 0, keepParams = true, updateBrightness = 0) {
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
         * @Enum(["off", "on", "invert", "open", "close", "stop"]);
         * @EnumNames(["devices.list.form.status.off", "devices.list.form.status.on", "devices.list.form.status.invert", "devices.list.form.status.open", "devices.list.form.status.close", "devices.list.form.status.stop"]);
         */
        this.status = status;

        /**
         * @Property("keepParams");
         * @Type("boolean");
         * @Title("devices.list.form.keep.params");
         * @Default(true);
         */
        this.keepParams = keepParams;

        /**
         * @Property("brightness");
         * @Type("number");
         * @Title("devices.list.form.brightness");
         * @Range([0, 1, 0.1]);
         */
        this.brightness = brightness;

        /**
         * @Property("color");
         * @Type("string");
         * @Title("devices.list.form.color");
         * @Display("color");
         */
        this.color = color;

        /**
         * @Property("colorTemperature");
         * @Type("number");
         * @Title("devices.list.form.color.temperature");
         * @Range([0, 1, 0.05]);
         */
        this.colorTemperature = colorTemperature;

        /**
         * @Property("updateBrightness");
         * @Type("number");
         * @Title("devices.list.form.color.update.brightness");
         * @Range([-1, 1, 0.1]);
         */
        this.updateBrightness = updateBrightness;
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
     * @returns {DevicesListForm}      A form object
     */
    json(data) {
        return new DevicesListForm(data.id, data.identifier, data.status, data.brightness, data.color, data.colorTemperature, data.keepParams, data.updateBrightness);
    }
}

module.exports = {class:DevicesListForm};
