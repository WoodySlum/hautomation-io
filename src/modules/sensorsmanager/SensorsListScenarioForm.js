var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for one device
 * @class
 */
class SensorsListScenarioForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {Array} [sensors=null]    An array if SensorsListForm
     * @returns {SensorsListScenarioForm}                            The instance
     */
    constructor(id = null, sensors = null) {
        super(id);

        /**
         * @Property("sensors");
         * @Type("objects");
         * @Cl("SensorScenarioForm");
         * @Title("sensors.list.scenario.sensors");
         */
        this.sensors = sensors;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {SensorsListScenarioForm}      A form object
     */
    json(data) {
        return new SensorsListScenarioForm(data.id, data.sensors);
    }
}

module.exports = {class:SensorsListScenarioForm};
