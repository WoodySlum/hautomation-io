var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for an scenario
 * @class
 */
class ScenarioForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {string} [name=null]                An scenario name
     * @param  {boolean} [enabled=null]                True if action is enabled, false otherwise
     * @param  {IconForm} [icon=null]                An icon
     * @param  {TimeScenarioForm} [timeTrigger=null]         The time trigger
     * @param {Array} [subActions=null]         The sub actions
     * @param {ScenarioTriggerAfterForm} [delay=null]         The delay
     * @returns {ScenarioForm} The instance
     */
    constructor(id = null, name = null, enabled = null, icon = null, timeTrigger = null, subActions = null, delay = null) {
        super(id);

        /**
         * @Property("name");
         * @Title("scenario.form.name");
         * @Type("string");
         * @Required(true);
         */
        this.name = name;

        /**
         * @Property("enabled");
         * @Title("scenario.form.enabled");
         * @Default(true);
         * @Type("boolean");
         */
        this.enabled = enabled;

        /**
         * @Property("icon");
         * @Title("");
         * @Type("object");
         * @Cl("IconForm");
         */
        this.icon = icon;

        /**
         * @Property("delay");
         * @Title("scenario.form.delay");
         * @Type("object");
         * @Cl("ScenarioTriggerAfterForm");
         */
        this.delay = delay;

        /**
         * @Property("timeTrigger");
         * @Title("scenario.form.time.trigger");
         * @Type("objects");
         * @Cl("TimeScenarioForm");
         * @Sort(200);
         */
        this.timeTrigger = timeTrigger;

        /**
         * @Property("subActions");
         * @Title("scenario.form.sub.action");
         * @Type("objects");
         * @Cl("ScenarioSubActionForm");
         */
        this.subActions = subActions;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {ScenarioForm}      A form object
     */
    json(data) {
        return new ScenarioForm(data.id, data.name, data.enabled, data.icon, data.timeTrigger, data.subActions, data.delay);
    }
}

module.exports = {class:ScenarioForm};
