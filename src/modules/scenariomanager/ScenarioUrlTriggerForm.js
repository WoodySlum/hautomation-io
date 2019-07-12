var FormObject = require("./../formmanager/FormObject");

/**
 * This class is used for URL scenario form
 * @class
 */
class ScenarioUrlTriggerForm extends FormObject.class {
    /**
      * Constructor
      *
      * @param  {number} id           Identifier
      * @param  {string} triggerUrlToken       The trigger url token
      * @param  {string} triggerUrl       The trigger url
      * @param  {string} status       The status
      * @returns {ScenarioUrlTriggerForm}              The instance
      */
    constructor(id, triggerUrlToken, triggerUrl, status) {
        super(id);

        /**
         * @Property("triggerUrlToken");
         * @Type("string");
         * @Hidden(true);
         * @Sort(200);
         */
        this.triggerUrlToken = triggerUrlToken;

        /**
         * @Property("triggerUrl");
         * @Type("string");
         * @Readonly(true);
         * @Title("scenario.form.url.trigger.url");
         * @Default("getUrl");
         */
        this.triggerUrl = triggerUrl;

        /**
         * @Property("status");
         * @Type("string");
         * @Title("scenario.form.url.trigger.status");
         * @Enum(["off", "on"]);
         * @EnumNames(["scenario.form.url.trigger.status.off", "scenario.form.url.trigger.status.on"]);
         * @Default("off");
         * @Display("radio");
         */
        this.status = status;
    }

    /**
     * Returns the  url for the scenario
     *
     * @param  {...Object} inject Parameters injection on static methods
     *
     * @returns {string} A complete URL
     */
    static getUrl(...inject) {
        let randomStr = "";
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const charactersLength = characters.length;
        for (var i = 0 ; i < 15 ; i++) {
            randomStr += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        return inject[0] + inject[1] + "/" + randomStr + "/";
    }

    /**
      * Convert json data
      *
      * @param  {Object} data Some key / value data
      * @returns {ScenarioUrlTriggerForm}      A form object
      */
    json(data) {
        return new ScenarioUrlTriggerForm(data.id, data.triggerUrlToken, data.triggerUrl, data.status);
    }
}

module.exports = {class:ScenarioUrlTriggerForm};
