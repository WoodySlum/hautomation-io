var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for a day / night trigger event for scenario
 * @class
 */
class DayNightScenarioTriggerForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {boolean} [day=false]                  Day falling
     * @param  {boolean} [night=false]                Night falling
     * @returns {DayNightScenarioTriggerForm} The instance
     */
    constructor(id = null, day = false, night = false) {
        super(id);

        /**
         * @Property("day");
         * @Title("daynight.scenario.trigger.day");
         * @Type("boolean");
         */
        this.day = day;

        /**
         * @Property("night");
         * @Title("daynight.scenario.trigger.night");
         * @Type("boolean");
         */
        this.night = night;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {DayNightScenarioTriggerForm}      A form object
     */
    json(data) {
        return new DayNightScenarioTriggerForm(data.id, data.day, data.night);
    }
}

module.exports = {class:DayNightScenarioTriggerForm};
