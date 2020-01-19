var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for a day / night trigger event for scenario
 * @class
 */
class DayNightScenarioForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {string} [mode="0"]                  Mode : 0 => none, 1 => day, 2 => night
     * @returns {DayNightScenarioForm} The instance
     */
    constructor(id = null, mode) {
        super(id);

        /**
         * @Property("mode");
         * @Type("string");
         * @Enum(["0", "1", "2"]);
         * @EnumNames(["environment.none", "environment.day", "environment.night"]);
         * @Display("radio");
         * @Default("0");
         * @Title(" ");
         */
        this.mode = mode;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {DayNightScenarioForm}      A form object
     */
    json(data) {
        return new DayNightScenarioForm(data.id, data.mode);
    }
}

module.exports = {class:DayNightScenarioForm};
