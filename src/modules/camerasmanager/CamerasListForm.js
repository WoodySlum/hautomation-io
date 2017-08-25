var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for cameras
 * @class
 */
class CamerasListForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {number} [identifier=null] The camera identifier
     * @returns {CamerasListForm}                            The instance
     */
    constructor(id = null, identifier = null) {
        super(id);

        /**
         * @Property("identifier");
         * @Type("number");
         * @Title("cameras.list.form.title");
         * @Enum("getCamerasId");
         * @EnumNames("getCamerasName");
         */
        this.identifier = identifier;
    }

    /**
     * Form injection method for Cameras name
     *
     * @param  {...Object} inject The modules list array
     * @returns {Array}        An array of cameras name
     */
    static getCamerasName(...inject) {
        return inject[0];
    }

    /**
     * Form injection method for Cameras ids
     *
     * @param  {...Object} inject The modules list array
     * @returns {Array}        An array of cameras id
     */
    static getCamerasId(...inject) {
        return inject[1];
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {CamerasListForm}      A form object
     */
    json(data) {
        return new CamerasListForm(data.id, data.identifier);
    }
}

module.exports = {class:CamerasListForm};
