var FormObject = require("./../modules/formmanager/FormObject");

/**
 * This class provides an icon select box form part
 * @class
 */
class IconForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]   An identifier
     * @param  {number} [icon=null] An icon number
     * @returns {IconForm}             The instance
     */
    constructor(id = null, icon = null) {
        super(id);

        /**
         * @Property("icon");
         * @Type("number");
         * @Title("icon.form.name");
         * @Enum("getIcons");
         * @EnumNames("getIcons");
         */
        this.icon = icon;
    }

    /**
     * Form injection method
     *
     * @param  {...Object} inject The icons list array
     * @returns {Array}        An array of icons
     */
    static getIcons(...inject) {
        return inject[0];
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {FormObject}      A form object
     */
    json(data) {
        return new IconForm(data.id, data.icon);
    }
}

module.exports = {class:IconForm};
