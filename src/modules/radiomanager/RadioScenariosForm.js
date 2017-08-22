var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a list of radio form part
 * @class
 */
class RadioScenariosForm  extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]       The id
     * @param  {Array} [radioScenariosForm=null]   The radio form objects
     * @returns {RadioScenariosForm}                 The instance
     */
    constructor(id = null, radioScenariosForm = null) {
        super(id);

        /**
         * @Property("radioScenariosForm");
         * @Type("objects");
         * @Cl("RadioScenarioForm");
         */
        this.radioScenariosForm = radioScenariosForm;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {RadioScenariosForm}      A form object
     */
    json(data) {
        return new RadioScenariosForm(data.id, data.radioScenariosForm);
    }
}

module.exports = {class:RadioScenariosForm};
