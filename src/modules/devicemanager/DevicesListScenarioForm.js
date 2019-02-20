var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for one device
 * @class
 */
class DevicesListScenarioForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {boolean} [turnOnAll=null]  Turn on all devices
     * @param  {boolean} [turnOffAll=null] Turn off all devices
     * @param  {Array} [devices=null]    An array if DevicesListForm
     * @param  {Array} [triggerOnDevice=null]    An array if DevicesListForm, scenario is triggered when this haappens
     * @returns {DevicesListScenarioForm}                            The instance
     */
    constructor(id = null, turnOnAll = null, turnOffAll = null, devices = null, triggerOnDevice = null) {
        super(id);

        /**
         * @Property("turnOnAll");
         * @Type("boolean");
         * @Title("devices.list.scenario.turnOnAll");
         */
        this.turnOnAll = turnOnAll;

        /**
         * @Property("turnOffAll");
         * @Type("boolean");
         * @Title("devices.list.scenario.turnOffAll");
         */
        this.turnOffAll = turnOffAll;

        /**
         * @Property("devices");
         * @Type("objects");
         * @Cl("DevicesListForm");
         * @Title("devices.list.scenario.devices");
         */
        this.devices = devices;

        /**
         * @Property("triggerOnDevice");
         * @Type("objects");
         * @Cl("DevicesListScenarioTriggerForm");
         * @Title("devices.list.scenario.trigger.devices");
         * @Sort(200);
         */
        this.triggerOnDevice = triggerOnDevice;
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {DevicesListScenarioForm}      A form object
     */
    json(data) {
        return new DevicesListScenarioForm(data.id, data.turnOnAll, data.turnOffAll, data.devices, data.triggerOnDevice);
    }
}

module.exports = {class:DevicesListScenarioForm};
