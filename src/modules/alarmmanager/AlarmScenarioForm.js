var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a scenario form for the alarm
 * @class
 */
class AlarmScenarioForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number}  id                  An identifier
     * @param  {string} [action="none"]            Alarm scenario action
     * @returns {AlarmScenarioForm} The instance
     */
    constructor(id, action = "none") {
        super(id);

        /**
         * @Property("action");
         * @Title(" ");
         * @Type("string");
         * @Enum(["none", "enable", "disable", "trigger"]);
         * @EnumNames(["alarm.scenario.form.action.none", "alarm.scenario.form.action.enable", "alarm.scenario.form.action.disable", "alarm.scenario.form.action.trigger"]);
         * @Display("radio");
         * @Default("none");
         */
        this.action = action;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {AlarmScenarioForm}      A form object
     */
    json(data) {
        return new AlarmScenarioForm(data.id, data.action);
    }
}

module.exports = {class:AlarmScenarioForm};
