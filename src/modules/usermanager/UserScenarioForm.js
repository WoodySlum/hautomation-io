var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for user location trigger event for scenario
 * @class
 */
class UserScenarioForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {number} [mode=null]                  The user home mode
     * @returns {UserScenarioForm} The instance
     */
    constructor(id = null, day = null, time = null) {
        super(id);

        /**
         * @Property("mode");
         * @Title("user.scenario.form.mode");
         * @Type("number");
         * @Enum([0,1,2,3]);
         * @EnumNames(["user.scenario.form.mode.none", "user.scenario.form.mode.everybody", "user.scenario.form.mode.nobody", "user.scenario.form.mode.at.least"]);
         * @Default(0);
         * @Display("radio");
         */
        this.mode = mode;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {UserScenarioForm}      A form object
     */
    json(data) {
        return new UserScenarioForm(data.id, data.mode);
    }
}

module.exports = {class:UserScenarioForm};
