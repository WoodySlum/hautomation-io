var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for an scenario
 * @class
 */
class ScenarioTriggerAfterForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {number} [delay=null]                A delay
     * @param  {string} [unit=null]                A delay unit
     * @returns {ScenarioTriggerAfterForm} The instance
     */
    constructor(id = null, delay = 0, unit = null) {
        super(id);

        /**
         * @Property("unit");
         * @Title("scenario.form.schedule.unit");
         * @Default("immediately");
         * @Type("string");
         * @Enum(["immediately", "minutes", "hours", "days"]);
         * @EnumNames(["scenario.form.schedule.immediatly", "scenario.form.schedule.minutes", "scenario.form.schedule.hours", "scenario.form.schedule.days"]);
         */
        this.unit = unit;

        /**
         * @Property("delay");
         * @Title("scenario.form.schedule.delay");
         * @Type("number");
         * @Required(false);
         * @Default(0);
         */
        this.delay = delay;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {ScenarioTriggerAfterForm}      A form object
     */
    json(data) {
        return new ScenarioTriggerAfterForm(data.id, data.delay, data.unit);
    }
}

module.exports = {class:ScenarioTriggerAfterForm};
