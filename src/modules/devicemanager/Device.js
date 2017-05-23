"use strict";

/**
 * This class is a Device POJO
 * @class
 */
class Device {
    /**
     * Device POJO
     *
     * @param  {string} id             A timestamp
     * @param  {string} description    Device's description
     * @param  {string} module         The RF module
     * @param  {string} protocol       The RF protocol
     * @param  {string} code           The RF code
     * @param  {string} subcode        The RF sub code (optional, depending on protocol)
     * @param  {string} rawCode        The RF raw code (if code and subcode not provided)
     * @param  {string} status         The status
     * @param  {string} icon           Icon
     * @param  {boolean} excludeFromAll Exclude from 'turn all on' or 'turn all off' command
     * @param  {int} priority           Priority
     * @param  {boolean} night          True if device command should be enabled onmly on night
     * @param  {boolean} visible        True if device is visible on dashboard, else false
     * @returns {Device}                A device object
     */
    constructor(id, description, module, protocol, code, subcode, rawCode, status, icon, excludeFromAll, priority, night, visible) {
        if (id) {
            this.id = id;
        } else {
            this.id = new Date().getTime();
        }
        this.description = description;
        this.module = module;
        this.protocol = protocol;
        this.code = code;
        this.subcode = subcode;
        this.rawCode = rawCode;
        this.status = status;
        this.icon = icon;
        this.excludeFromAll = excludeFromAll;
        this.priority = priority;
        this.night = night;
        this.visible = visible;
    }

    /**
     * Transform json raw object to instance
     *
     * @param  {Object} data JSON object data
     * @returns {Device} A Device instance
     */
    json(data) {
        return new Device(data.id, data.description, data.module, data.protocol, data.code, data.subcode, data.rawCode, data.status, data.icon, data.excludeFromAll, data.priority, data.night, data.visible);
    }
}

module.exports = {class:Device};
