var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides the list of scenarios
 * @class
 */
class ScenariosListForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {number} [identifier=null] The scenario identifier
     * @returns {ScenariosListForm}                            The instance
     */
    constructor(id = null, identifier = null) {
        super(id);

        /**
         * @Property("scenario");
         * @Type("number");
         * @Title("scenario.form.list.scenario");
         * @Enum("getScenariosId");
         * @EnumNames("getScenariosName");
         */
        this.identifier = identifier;
    }

    /**
     * Form injection method for Scenarios name
     *
     * @param  {...Object} inject The modules list array
     * @returns {Array}        An array of devices name
     */
    static getScenariosName(...inject) {
        return inject[0];
    }

    /**
     * Form injection method for Scenarios ids
     *
     * @param  {...Object} inject The modules list array
     * @returns {Array}        An array of devices id
     */
    static getScenariosId(...inject) {
        return inject[1];
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {ScenariosListForm}      A form object
     */
    json(data) {
        return new ScenariosListForm(data.id, data.identifier);
    }
}

module.exports = {class:ScenariosListForm};
