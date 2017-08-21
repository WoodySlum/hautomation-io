var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides the sub actions
 * @class
 */
class ScenarioSubActionForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {ScenariosListForm} [scenario=null] The scenario
     * @param  {number} [delay=null] The delay
     * @returns {ScenarioSubActionForm}                            The instance
     */
    constructor(id = null, scenario = null, delay = null) {
        super(id);

        /**
         * @Property("scenario");
         * @Type("object");
         * @Cl("ScenariosListForm");
         */
        this.scenario = scenario;

        /**
         * @Property("delay");
         * @Type("number");
         * @Min(1);
         * @Max(3600);
         * @Title("scenario.form.subaction.sub.action.delay");
         */
        this.delay = delay;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {ScenarioSubActionForm}      A form object
     */
    json(data) {
        return new ScenarioSubActionForm(data.id, data.scenario, data.delay);
    }
}

module.exports = {class:ScenarioSubActionForm};
