var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a iot list form
 * @class
 */
class IotsListForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {number} [identifier=null] The iot identifier
     * @returns {DevicesListForm}                            The instance
     */
    constructor(id = null, identifier = null) {
        super(id);

        /**
         * @Property("identifier");
         * @Type("number");
         * @Title("iots.list.form.title");
         * @Enum("getIotsId");
         * @EnumNames("getIotsName");
         */
        this.identifier = identifier;
    }

    /**
     * Form injection method for Iots name
     *
     * @param  {...Object} inject The modules list array
     * @returns {Array}        An array of iots name
     */
    static getIotsName(...inject) {
        return inject[0];
    }

    /**
     * Form injection method for Iots ids
     *
     * @param  {...Object} inject The modules list array
     * @returns {Array}        An array of iots id
     */
    static getIotsId(...inject) {
        return inject[1];
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {IotsListForm}      A form object
     */
    json(data) {
        return new IotsListForm(data.id, data.identifier);
    }
}

module.exports = {class:IotsListForm};
