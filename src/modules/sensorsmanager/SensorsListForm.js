var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for sensors
 * @class
 */
class SensorsListForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {number} [identifier=null] The sensor identifier
     * @returns {SensorsListForm}                            The instance
     */
    constructor(id = null, identifier = null) {
        super(id);

        /**
         * @Property("identifier");
         * @Type("number");
         * @Title("sensors.list.form.title");
         * @Enum("getSensorsId");
         * @EnumNames("getSensorsName");
         */
        this.identifier = identifier;
    }

    /**
     * Form injection method for Sensors name
     *
     * @param  {...Object} inject The modules list array
     * @returns {Array}        An array of sensors name
     */
    static getSensorsName(...inject) {
        return inject[0];
    }

    /**
     * Form injection method for Sensors ids
     *
     * @param  {...Object} inject The modules list array
     * @returns {Array}        An array of sensors id
     */
    static getSensorsId(...inject) {
        return inject[1];
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {SensorsListForm}      A form object
     */
    json(data) {
        return new SensorsListForm(data.id, data.identifier);
    }
}

module.exports = {class:SensorsListForm};
