var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides home environment form
 * @class
 */
class EnvironmentForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {boolean} [day=null]                Day or night
     * @returns {EnvironmentForm}                            The instance
     */
    constructor(id = null, day = null) {
        super(id);

        /**
         * @Property("day");
         * @Type("boolean");
         * @Default(true);
         * @Title("environment.form.day");
         */
        this.day = day;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {EnvironmentForm}      A form object
     */
    json(data) {
        return new EnvironmentForm(data.id, data.day);
    }
}

module.exports = {class:EnvironmentForm};
