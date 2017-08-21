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
     * @returns {ScenarioForm} The instance
     */
    constructor(id = null, name = null, enabled = null, icon = null, timeTrigger = null) {
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
         * @Property("timeTrigger");
         * @Title("scenario.form.time.trigger");
         * @Type("objects");
         * @Cl("TimeScenarioForm");
         */
        this.timeTrigger = timeTrigger;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {ScenarioForm}      A form object
     */
    json(data) {
        return new ScenarioForm(data.id, data.name, data.enabled, data.icon, data.timeTrigger);
    }
}

module.exports = {class:ScenarioForm};
