var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for one device
 * @class
 */
class SensorsForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {number} [sensorId=null]                A sensor identifier
     * @returns {SensorsForm}                            The instance
     */
    constructor(id = null, sensorId = null) {
        super(id);

        /**
         * @Property("sensorId");
         * @Type("string");
         * @Title("form.sensor.title");
         * @Enum("getSensorIds");
         * @EnumNames("getSensorNames");
         * @Display("checkbox");
         */
        this.sensorId = sensorId;
    }

    static getSensorIds(...inject) {
        return [inject[0]];
    }

    static getSensorNames(...inject) {
        return [inject[1]];
    }


    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {SensorsForm}      A form object
     */
    json(data) {
        return new SensorsForm(data.id, data.sensorId);
    }
}

module.exports = {class:SensorsForm};
