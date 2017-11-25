var FormObject = require("./../formmanager/FormObject");
const STATUS_ALL = 9999999;

/**
 * This class provides a radio form part
 * @class
 */
class RadioScenarioForm  extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]       The id
     * @param  {RadioForm} [radioForm=null]   The radio form object
     * @param  {number} [status=null] The status
     * @returns {RadioScenarioForm}                 The instance
     */
    constructor(id = null, radioForm = null, status = null) {
        super(id);

        /**
         * @Property("radio");
         * @Type("object");
         * @Cl("RadioForm");
         */
        this.radioForm = radioForm;

        /**
         * @Property("status");
         * @Type("number");
         * @Title("radio.scenario.form.status");
         * @Enum([1, -1, 9999999]);
         * @EnumNames(["radio.scenario.form.status.on", "radio.scenario.form.status.off", "radio.scenario.form.status.all"]);
         */
        this.status = status;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {RadioScenarioForm}      A form object
     */
    json(data) {
        return new RadioScenarioForm(data.id, data.radioForm, data.status);
    }
}

module.exports = {class:RadioScenarioForm, STATUS_ALL:STATUS_ALL};
