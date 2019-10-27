var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for scenario lock
 * @class
 */
class ScenarioLockForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {boolean} [enabled=null]                True if lock is effective, false otherwise
     * @param  {number} [timer=null]                A timer
     * @returns {ScenarioLockForm} The instance
     */
    constructor(id = null, enabled = false, timer = null) {
        super(id);

        /**
         * @Property("enabled");
         * @Title("scenario.form.lock.enabled");
         * @Default(false);
         * @Type("boolean");
         */
        this.enabled = enabled;

        /**
         * @Property("timer");
         * @Title("scenario.form.lock.timer");
         * @Type("number");
         * @Required(false);
         * @Default(0);
         */
        this.timer = timer;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {ScenarioLockForm}      A form object
     */
    json(data) {
        return new ScenarioLockForm(data.id, data.enabled, data.timer);
    }
}

module.exports = {class:ScenarioLockForm};
