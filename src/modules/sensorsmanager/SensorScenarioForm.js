var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for one device
 * @class
 */
class SensorScenarioForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {Array} [sensor=null]    An array if SensorsListForm
     * @param {string} [operator="="]           The operator
     * @param {number} [threshold=0] The threshold
     * @returns {SensorScenarioForm}                            The instance
     */
    constructor(id = null, sensor = null, operator = "=", threshold = 0) {
        super(id);

        /**
         * @Property("sensor");
         * @Type("object");
         * @Cl("SensorsListForm");
         */
        this.sensor = sensor;

        /**
         * @Property("operator");
         * @Type("string");
         * @Enum(["value", "=", ">", "<"]);
         * @EnumNames(["sensors.manager.scenario.value", "=", ">", "<"]);
         * @Title("sensors.manager.scenario.operator");
         * @Default("value");
         */
        this.operator = operator;

        /**
         * @Property("threshold");
         * @Type("number");
         * @Title("sensors.manager.scenario.threshold");
         * @Default(0);
         */
        this.threshold = threshold;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {SensorScenarioForm}      A form object
     */
    json(data) {
        return new SensorScenarioForm(data.id, data.sensor, data.operator, data.threshold);
    }
}

module.exports = {class:SensorScenarioForm};
