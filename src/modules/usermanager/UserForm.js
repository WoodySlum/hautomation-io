var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for one user
 * @class
 */
class UserForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {string} [username=null] Username
     * @param  {string} [password=null] Password
     * @param  {int} [level=null] Authorization level
     * @param  {string} [name=null] Full name
     * @param  {string} [picture=null]  Picture, in base64 format
     * @returns {User} The instance
     */
    constructor(id = null, username = null, password = null, level = null, name = null, picture = null) {
        super(id);

        /**
         * @Property("username");
         * @Title("user.form.username");
         * @Type("string");
         * @Required(true);
         */
        this.username = username;

        /**
         * @Property("password");
         * @Title("user.form.password");
         * @Type("string");
         * @Required(true);
         */
        this.password = password;

        /**
         * @Property("level");
         * @Title("user.form.level");
         * @Type("number");
         * @EnumNames(["user.form.level.disabled", "user.form.level.standard", "user.form.level.admin"]);
         * @Enum([0, 10, 80]);
         * @Required(true);
         */
        this.level = level;

        /**
         * @Property("name");
         * @Title("user.form.fullname");
         * @Type("string");
         * @Required(true);
         */
        this.name = name;

        /**
         * @Property("picture");
         * @Title("user.form.picture");
         * @Type("file");
         */
        this.picture = picture;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {UserForm}      A form object
     */
    json(data) {
        return new UserForm(data.id, data.username, data.password, data.level, data.name, data.picture);
    }
}

module.exports = {class:UserForm};
