var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for a time trigger event for scenario
 * @class
 */
class TimeScenarioForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {number} [day=null]                  The day indicator
     * @param  {string} [time=null]                The time
     * @returns {TimeScenarioForm} The instance
     */
    constructor(id = null, day = null, time = null) {
        super(id);

        /**
         * @Property("day");
         * @Title("time.scenario.form.day");
         * @Type("number");
         * @Enum([1,2,3,4,5,6,0]);
         * @EnumNames(["time.scenario.form.day.monday", "time.scenario.form.day.tuesday", "time.scenario.form.day.wednesday", "time.scenario.form.day.thursday", "time.scenario.form.day.friday", "time.scenario.form.day.saturday", "time.scenario.form.day.sunday"]);
         */
        this.day = day;

        /**
         * @Property("time");
         * @Title("time.scenario.form.time");
         * @Type("string");
         * @Regexp("[0-9]{1,2}:[0-9]{1,2}");
         */
        this.time = time;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {TimeScenarioForm}      A form object
     */
    json(data) {
        return new TimeScenarioForm(data.id, data.day, data.time);
    }
}

module.exports = {class:TimeScenarioForm};
