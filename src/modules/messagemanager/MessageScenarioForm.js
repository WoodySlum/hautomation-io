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
     * @param  {string} [lockTime=0]  Lock timer
     * @returns {MessageScenarioForm}                            The instance
     */
    constructor(id = null, message = null, lockTime = "0") {
        super(id);

        /**
         * @Property("message");
         * @Type("string");
         * @Title("message.scenario.message");
         */
        this.message = message;

        /**
         * @Property("lockTime");
         * @Type("string");
         * @Title("message.scenario.lock.time");
         * @Enum(["0", "1", "2", "4", "6", "12", "24"]);
         * @EnumNames(["message.scenario.lock.time.none", "message.scenario.lock.time.one.hour", "message.scenario.lock.time.two.hours", "message.scenario.lock.time.four.hours", "message.scenario.lock.time.six.hours", "message.scenario.lock.time.twelve.hours", "message.scenario.lock.time.twenty.four.hours"]);
         * @Default("0");
         */
        this.lockTime = lockTime;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {MessageScenarioForm}      A form object
     */
    json(data) {
        return new MessageScenarioForm(data.id, data.message, data.lockTime);
    }
}

module.exports = {class:MessageScenarioForm};
