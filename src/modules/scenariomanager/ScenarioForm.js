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
     * @param  {IconForm} [icon=null]                An icon
     * @param  {TimeScenarioForm} [timeTrigger=null]         The time trigger
     * @returns {ScenarioForm} The instance
     */
    constructor(id = null, name = null, icon = null, timeTrigger = null) {
        super(id);

        /**
         * @Property("name");
         * @Title("device.form.name");
         * @Type("string");
         * @Required(true);
         */
        this.name = name;

        /**
         * @Property("icon");
         * @Title("");
         * @Type("object");
         * @Cl("IconForm");
         */
        this.icon = icon;

        /**
         * @Property("timeTrigger");
         * @Title("device.form.time.trigger");
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
        return new ScenarioForm(data.id, data.name, data.icon, data.timeTrigger);
    }
}

module.exports = {class:ScenarioForm};
