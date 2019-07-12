var FormObject = require("./../formmanager/FormObject");

/**
 * This class is used for URL scenario form
 * @class
 */
class ScenarioUrlCallForm extends FormObject.class {
    /**
      * Constructor
      *
      * @param  {number} id           Identifier
      * @param  {string} url       The url
      * @param  {string} method       The method
      * @returns {ScenarioUrlCallForm}              The instance
      */
    constructor(id, url, method) {
        super(id);

        /**
         * @Property("url");
         * @Title("scenario.form.url.call.url");
         * @Type("string");
         */
        this.url = url;

        /**
         * @Property("method");
         * @Type("string");
         * @Title("scenario.form.url.call.method");
         * @Enum(["GET", "POST"]);
         * @EnumNames(["GET", "POST"]);
         * @Default("GET");
         */
        this.method = method;
    }

    /**
      * Convert json data
      *
      * @param  {Object} data Some key / value data
      * @returns {ScenarioUrlCallForm}      A form object
      */
    json(data) {
        return new ScenarioUrlCallForm(data.id, data.url, data.method);
    }
}

module.exports = {class:ScenarioUrlCallForm};
