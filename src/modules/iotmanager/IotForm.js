var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides an Iot device. Need to be overloaded.
 * @class
 */
class IotForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {string} [iotApp=null]                An iot app identifier
     * @param  {string} [name=null]                A device name
     * @returns {DeviceForm}                            The instance
     */
    constructor(id = null, iotApp = null, name = null) {
        super(id);

        /**
         * @Property("iotApp");
         * @Title("iot.form.app");
         * @Type("string");
         * @Required(true);
         * @Hidden(true);
         */
        this.iotApp = iotApp;

        /**
         * @Property("name");
         * @Title("iot.form.name");
         * @Type("string");
         * @Required(true);
         */
        this.name = name;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {IotForm}      A form object
     */
    json(data) {
        return new IotForm(data.id, data.iotApp, data.name);
    }
}

module.exports = {class:IotForm};
