var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for alarm sensors form
 * @class
 */
class AlarmSensorsForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {string} [sensor=null] Sensor
     * @param  {boolean} [triggerAlarm=null] Trigger alarm
     * @param  {boolean} [captureVideo=null] Capture video
     * @returns {AlarmForm} The instance
     */
    constructor(id = null,  sensor = null, triggerAlarm = true, captureVideo = false) {
        super(id);

        /**
         * @Property("sensor");
         * @Type("object");
         * @Cl("SensorsListForm");
         */
        this.sensor = sensor;

        /**
         * @Property("triggerAlarm");
         * @Title("alarm.form.sensors.alarm.trigger");
         * @Type("boolean");
         * @Default(true);
         */
        this.triggerAlarm = triggerAlarm;

        /**
         * @Property("captureVideo");
         * @Title("alarm.form.sensors.video.capture");
         * @Type("boolean");
         * @Default(false);
         */
        this.captureVideo = captureVideo;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {AlarmSensorsForm}      A form object
     */
    json(data) {
        return new AlarmSensorsForm(data.id, data.sensor, data.triggerAlarm, data.captureVideo);
    }
}

module.exports = {class:AlarmSensorsForm};
