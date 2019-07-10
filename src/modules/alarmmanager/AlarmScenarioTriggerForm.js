var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a scenario trigger form for the alarm
 * @class
 */
class AlarmScenarioTriggerForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number}  id                  An identifier
     * @param  {string} [trigger="none"]            Alarm trigger
     * @returns {AlarmScenarioTriggerForm} The instance
     */
    constructor(id, trigger = "none") {
        super(id);

        /**
         * @Property("trigger");
         * @Title(" ");
         * @Type("string");
         * @Enum(["none", "enable", "disable", "trigger"]);
         * @EnumNames(["alarm.scenario.form.trigger.action.none", "alarm.scenario.form.trigger.action.enable", "alarm.scenario.form.trigger.action.disable", "alarm.scenario.form.trigger.action.trigger"]);
         * @Display("radio");
         * @Default("none");
         */
        this.trigger = trigger;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {AlarmScenarioTriggerForm}      A form object
     */
    json(data) {
        return new AlarmScenarioTriggerForm(data.id, data.trigger);
    }
}

module.exports = {class:AlarmScenarioTriggerForm};
