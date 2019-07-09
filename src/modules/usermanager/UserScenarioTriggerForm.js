var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for user location trigger event for scenario
 * @class
 */
class UserScenarioTriggerForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {string} [username=null]                  The user name
     * @param  {number} [inorout=null]                  The mode in, out or invert
     * @returns {UserScenarioTriggerForm} The instance
     */
    constructor(id = null, username = null, inorout = null) {
        super(id);

        /**
         * @Property("username");
         * @Title("user.scenario.form.username");
         * @Type("string");
         * @Enum("getUsers");
         * @EnumNames("getUsersLabels");
         */
        this.username = username;

        /**
         * @Property("inorout");
         * @Title("user.scenario.form.inorout");
         * @Type("number");
         * @Enum([1, 2, 3]);
         * @EnumNames(["user.scenario.form.inorout.in", "user.scenario.form.inorout.out", "user.scenario.form.inorout.invert"]);
         * @Default(0);
         * @Display("radio");
         */
        this.inorout = inorout;
    }

    /**
     * Get the users list
     *
     * @param  {...Object} inject Parameters injection on static methods
     * @returns {Array}        An array of users
     */
    static getUsers(...inject) {
        return inject[0];
    }

    /**
     * Get the users name list
     *
     * @param  {...Object} inject Parameters injection on static methods
     * @returns {Array}        An array of users name
     */
    static getUsersLabels(...inject) {
        return inject[1];
    }


    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {UserScenarioTriggerForm}      A form object
     */
    json(data) {
        return new UserScenarioTriggerForm(data.id, data.username, data.inorout);
    }
}

module.exports = {class:UserScenarioTriggerForm};
