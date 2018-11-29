var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for one device
 * @class
 */
class DeviceForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {string} [name=null]                A device name
     * @param  {boolean} [excludeFromAll=null]      When all on or all of is called, set this value to `true` won't do action
     * @param  {boolean} [visible=null]             Show in dashboard
     * @param  {number} [worksOnlyOnDayNight=null]  Trigger on condition : `0` for Both, `1` for day, `2` for night
     * @param  {IconForm} [icon=null]                An icon
     * @param  {RadioForm} [radio=null]               A radio informations
     * @param  {number} [status=null]              A status
     * @returns {DeviceForm}                            The instance
     */
    constructor(id = null, name = null, excludeFromAll = false, visible = true, worksOnlyOnDayNight = 1, icon = {}, radio = [], status = -1) {
        super(id);

        /**
         * @Property("name");
         * @Title("device.form.name");
         * @Type("string");
         * @Required(true);
         */
        this.name = name;

        /**
         * @Property("excludeFromAll");
         * @Type("boolean");
         * @Default(false);
         * @Title("device.form.excludeFromAll");
         */
        this.excludeFromAll = excludeFromAll;

        /**
         * @Property("visible");
         * @Type("boolean");
         * @Default(true);
         * @Title("device.form.visible");
         */
        this.visible = visible;

        /**
         * @Property("worksOnlyOnDayNight");
         * @Type("number");
         * @Default(1);
         * @Title("device.form.worksOnlyOnDayNight");
         * @Enum([1, 2, 3]);
         * @EnumNames(["device.form.worksOnlyOnDayNight.both", "device.form.worksOnlyOnDayNight.day", "device.form.worksOnlyOnDayNight.night"]);
         */
        this.worksOnlyOnDayNight = worksOnlyOnDayNight;

        /**
         * @Property("icon");
         * @Title("");
         * @Type("object");
         * @Cl("IconForm");
         */
        this.icon = icon;

        /**
         * @Property("status");
         * @Type("number");
         * @Hidden(true);
         * @Default(-1);
         * @Title("device.form.status");
         */
        this.status = status;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {DeviceForm}      A form object
     */
    json(data) {
        return new DeviceForm(data.id, data.name, data.excludeFromAll, data.visible, data.worksOnlyOnDayNight, data.icon, data.radio, data.status);
    }
}

module.exports = {class:DeviceForm};
