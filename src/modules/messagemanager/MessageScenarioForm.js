var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for one device
 * @class
 */
class MessageScenarioForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {string} [message=null]  A message
     * @returns {MessageScenarioForm}                            The instance
     */
    constructor(id = null, message = null) {
        super(id);

        /**
         * @Property("message");
         * @Type("string");
         * @Title("message.scenario.message");
         */
        this.message = message;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {MessageScenarioForm}      A form object
     */
    json(data) {
        return new MessageScenarioForm(data.id, data.message);
    }
}

module.exports = {class:MessageScenarioForm};
