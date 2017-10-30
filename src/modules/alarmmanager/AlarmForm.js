var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for the alarm
 * @class
 */
class AlarmForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number}  [id=null]                  An identifier
     * @param  {boolean} [enabled=false]            Alarm status
     * @param  {boolean} [armed=false]              Alarm armed status
     * @param  {boolean} [userLocationTrigger=true] User location trigger
     * @param  {Array}   [sensors=[]]               List of sensors
     * @param  {Array}   [devicesOnEnable=[]]       Device to trigger when alarm is triggered
     * @param  {Array}   [devicesOnDisable=[]]      Device to trigger when alarm is stopped
     * @returns {AlarmForm} The instance
     */
    constructor(id = null, enabled = false, armed = false, userLocationTrigger = true, sensors = [], devicesOnEnable = [], devicesOnDisable = []) {
        super(id);

        /**
         * @Property("enabled");
         * @Title("alarm.form.status");
         * @Type("boolean");
         * @Default(false);
         * @Hidden(true);
         */
        this.enabled = enabled;

        /**
         * @Property("armed");
         * @Title("alarm.form.armed");
         * @Type("boolean");
         * @Default(false);
         * @Hidden(true);
         */
        this.armed = armed;

        /**
         * @Property("userLocationTrigger");
         * @Title("alarm.form.user.location.trigger");
         * @Type("boolean");
         * @Default(true);
         */
        this.userLocationTrigger = userLocationTrigger;

        /**
         * @Property("userLocationTrigger");
         * @Title("alarm.form.user.location.trigger");
         * @Type("boolean");
         * @Default(true);
         */
        this.userLocationTrigger = userLocationTrigger;

        /**
         * @Property("sensors");
         * @Title("alarm.form.trigger.sensors");
         * @Type("objects");
         * @Cl("AlarmSensorsForm");
         * @Default([]);
         */
        this.sensors = sensors;

        /**
         * @Property("devicesOnEnable");
         * @Title("alarm.form.devices.enable");
         * @Type("objects");
         * @Cl("DevicesListForm");
         * @Default([]);
         */
        this.devicesOnEnable = devicesOnEnable;

        /**
         * @Property("devicesOnDisable");
         * @Title("alarm.form.devices.disable");
         * @Type("objects");
         * @Cl("DevicesListForm");
         * @Default([]);
         */
        this.devicesOnDisable = devicesOnDisable;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {AlarmForm}      A form object
     */
    json(data) {
        return new AlarmForm(data.id, data.enabled, data.armed, data.userLocationTrigger, data.sensors, data.devicesOnEnable, data.devicesOnDisable);
    }
}

module.exports = {class:AlarmForm};
