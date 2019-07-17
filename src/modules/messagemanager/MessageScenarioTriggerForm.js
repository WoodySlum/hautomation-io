var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form to trigger scenarion from a message
 * @class
 */
class MessageScenarioTriggerForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {string} keyword  A keyword
     * @returns {MessageScenarioTriggerForm}                            The instance
     */
    constructor(id = null, keyword) {
        super(id);

        /**
         * @Property("keyword");
         * @Type("string");
         * @Title("message.scenario.trigger.keyword");
         */
        this.keyword = keyword;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {MessageScenarioTriggerForm}      A form object
     */
    json(data) {
        return new MessageScenarioTriggerForm(data.id, data.keyword);
    }
}

module.exports = {class:MessageScenarioTriggerForm};
