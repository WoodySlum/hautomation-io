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
     * @param  {string} [icon=null] An icon number
     * @returns {IconForm}             The instance
     */
    constructor(id = null, icon = null) {
        super(id);

        /**
         * @Property("icon");
         * @Type("string");
         * @Display("typeahead");
         * @Title("icon.form.name");
         * @Enum("getIcons");
         * @EnumNames("getIconsLabels");
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
     * Form injection method
     *
     * @param  {...Object} inject The icons labels list array
     * @returns {Array}        An array of icons labels
     */
    static getIconsLabels(...inject) {
        return inject[1];
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
