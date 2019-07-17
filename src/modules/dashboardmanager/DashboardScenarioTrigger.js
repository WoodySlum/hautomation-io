var FormObject = require("./../formmanager/FormObject");

/**
 * This class is used for dashboard scenario form
 * @class
 */
class DashboardScenarioTriggerForm extends FormObject.class {
    /**
      * Constructor
      *
      * @param  {number} id           Identifier
      * @param  {string} status       The status
      * @param  {IconForm} icon       The icon
      * @param  {string} title       The title
      * @returns {ScenarioUrlTriggerForm}              The instance
      */
    constructor(id, status, icon, title) {
        super(id);

        /**
         * @Property("status");
         * @Type("string");
         * @Title("dashboard.scenario.trigger.status");
         * @Enum(["off", "on"]);
         * @EnumNames(["dashboard.scenario.trigger.status.off", "dashboard.scenario.trigger.status.on"]);
         * @Default("off");
         * @Display("radio");
         */
        this.status = status;

        /**
         * @Property("icon");
         * @Type("object");
         * @Cl("IconForm");
         */
        this.icon = icon;

        /**
         * @Property("title");
         * @Type("string");
         * @Title("dashboard.scenario.trigger.title");
         */
        this.title = title;
    }

    /**
      * Convert json data
      *
      * @param  {Object} data Some key / value data
      * @returns {DashboardScenarioTriggerForm}      A form object
      */
    json(data) {
        return new DashboardScenarioTriggerForm(data.id, data.status, data.icon, data.title);
    }
}

module.exports = {class:DashboardScenarioTriggerForm};
