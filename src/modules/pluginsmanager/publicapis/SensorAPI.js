"use strict";
const PrivateProperties = require("./../PrivateProperties");
const IotsListForm = require("./../../iotmanager/IotsListForm");

/**
 * Public API for sensor
 * @class
 */
class SensorAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {FormManager} formManager A form manager
    //  * @param  {PluginAPI} plugin        Plugin API
    //  * @param  {SensorsManager} sensorsManager        The sensors manager
    //  * @return {SensorAPI}             The instance
    //  */
    constructor(formManager, plugin, sensorsManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).formManager = formManager;
        PrivateProperties.oprivate(this).plugin = plugin;
        PrivateProperties.oprivate(this).sensorsManager = sensorsManager;
        this.form = null;
        this.sensorClass = null;
        this.iotRef = false;
    }
    /* eslint-enable */

    /**
     * Register a sensor form
     *
     * @param  {Class} formClass A form annotation's implemented class
     * @param  {...Object} inject    The injected objects
     */
    registerForm(formClass, ...inject) {
        this.form = formClass;
        PrivateProperties.oprivate(this).formManager.registerWithAdditionalFields(formClass,{plugin:[{ key: "Type", value: "string" },{ key: "Hidden", value: true },{ key: "Default", value: PrivateProperties.oprivate(this).plugin.identifier}]}, ...inject);
        PrivateProperties.oprivate(this).plugin.exportClass(formClass);

        if (this.iotRef) {
            PrivateProperties.oprivate(this).formManager.addAdditionalFields(formClass, null, [IotsListForm.class]);
        }
    }

    /**
     * Register a sensor class
     *
     * @param  {Class} c A sensor extended class
     */
    registerClass(c) {
        this.sensorClass = c;
        PrivateProperties.oprivate(this).plugin.exportClass(c);
    }

    /**
     * Register a callback for a/all sensor
     *
     * @param  {Function} cb               A callback `(id, type, value, unit, vcc, aggValue, aggUnit) => {}`
     * @param  {string}   [identifier="*"] A sensor identifier (retrieved through `getAllSensors()`, or `*` for all)
     * @param  {string}   [type="*"]       A sensor type. For all types, use `*`
     */
    registerSensorEvent(cb, identifier = "*", type = "*") {
        PrivateProperties.oprivate(this).sensorsManager.registerSensorEvent(cb, identifier, type);
    }

    /**
     * Unregister a callback for a/all sensor
     *
     * @param  {Function} cb               A callback `(id, type, value, unit, vcc, aggValue, aggUnit) => {}`
     * @param  {string}   [identifier="*"] A sensor identifier (retrieved through `getAllSensors()`, or `*` for all)
     * @param  {string}   [type="*"]       A sensor type. For all types, use `*`
     */
    unregisterSensorEvent(cb, identifier = "*", type = "*") {
        PrivateProperties.oprivate(this).sensorsManager.unregisterSensorEvent(cb, identifier, type);
    }

    /* eslint-disable */
    // /**
    //  * Callback when a sensor receives a value
    //  *
    //  * @param  {number} id       The identifier
    //  * @param  {string} type     The type
    //  * @param  {number} value    The raw value
    //  * @param  {string} unit     The raw unit
    //  * @param  {number} vcc      The sensor's voltage
    //  * @param  {number} aggValue The aggregated value
    //  * @param  {string} aggUnit  The aggregated unit
    //  */
    onNewSensorValue(id, type, value, unit, vcc, aggValue, aggUnit) {
        PrivateProperties.oprivate(this).sensorsManager.onNewSensorValue(id, type, value, unit, vcc, aggValue, aggUnit);
    }
    /* eslint-enable */


    /**
     * Get all sensors
     *
     * @param  {string} [type=null] Sensor's type or category. If not specified, send back all sensors.
     *
     * @returns {Object} On object with id:name
     */
    getSensors(type = null) {
        return PrivateProperties.oprivate(this).sensorsManager.getAllSensors(type);
    }

    /**
     * Get a sensor's value
     *
     * @param  {number}   id              The sensor's identifier
     * @param  {Function} cb              A callback e.g. `(err, res) => {}`
     * @param  {number}   [duration=null] A duration in seconds. If null or not provided, will provide last inserted database value.
     */
    getValue(id, cb, duration = null) {
        PrivateProperties.oprivate(this).sensorsManager.getValue(id, cb, duration);
    }

    /**
     * Get sensor by identifier
     *
     * @param  {string} identifier An identiifer
     * @returns {Sensor}            A sensor object
     */
    getSensor(identifier) {
        return PrivateProperties.oprivate(this).sensorsManager.getSensor(identifier);
    }

    /**
     * Call this if your plugin is linked to an iot. The iot list form will be automatically added.
     * The method should be called before `registerForm()` !
     */
    iotAppPowered() {
        this.iotRef = true;
    }
}

module.exports = {class:SensorAPI};
