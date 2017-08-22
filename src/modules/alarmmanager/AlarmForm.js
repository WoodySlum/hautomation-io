var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for one user
 * @class
 */
class AlarmForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {boolean} [enabled=null] Status
     * @param  {boolean} [userLocationTrigger=null] User location auto trigger
     * @returns {AlarmForm} The instance
     */
    constructor(id = null, enabled = null, userLocationTrigger = null) {
        super(id);

        /**
         * @Property("enabled");
         * @Title("alarm.form.status");
         * @Type("boolean");
         * @Default(false);
         * @Display("hidden");
         */
        this.enabled = enabled;

        /**
         * @Property("userLocationTrigger");
         * @Title("alarm.form.user.location.trigger");
         * @Type("boolean");
         * @Default(true);
         */
        this.userLocationTrigger = userLocationTrigger;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {AlarmForm}      A form object
     */
    json(data) {
        return new AlarmForm(data.id, data.enabled, data.userLocationTrigger);
    }
}

module.exports = {class:AlarmForm};
