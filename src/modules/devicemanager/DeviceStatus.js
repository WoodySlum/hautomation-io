/**
 * This class provides is a POJO for device status
 * @class
 */
class DeviceStatus {
    /**
     * Constructor
     *
     * @param {[string]} deviceTypes Supported mode for device
     * @param {int} status     The status
     * @param {int} brightness The brightness
     * @param {string} color      The color
     * @param {int} colorTemperature The color temperature
     * @param {[string]} changes Changes
     */
    constructor(deviceTypes, status, brightness, color, colorTemperature, changes = []) {
        this.deviceTypes = deviceTypes;
        this.status = status;
        this.brightness = brightness;
        this.color = color;
        this.colorTemperature = colorTemperature;
        this.changes = changes;
    }

    /**
     * Get status
     *
     * @returns {number} Status
     */
    getStatus() {
        return parseInt(this.status);
    }

    /**
     * Get Brightness
     *
     * @returns {number} Brightness
     */
    getBrightness() {
        return this.brightness ? parseFloat(this.brightness) : null;
    }

    /**
     * Get color
     *
     * @returns {string} Color
     */
    getColor() {
        return this.color ? this.color.toUpperCase().replace("#", "") : null;
    }

    /**
     * Get color temperature
     *
     * @returns {number} Color temperature
     */
    getColorTemperature() {
        return this.colorTemperature ? parseFloat(this.colorTemperature) : null;
    }

    /**
     * Set status
     *
     * @param {int} status The status
     */
    setStatus(status) {
        this.status = status;
    }

    /**
     * Set brightness
     *
     * @param {int} brightness The brightness (value between 0 and 1)
     */
    setBrightness(brightness) {
        this.brightness = parseFloat(brightness);
    }

    /**
     * Set color
     *
     * @param {string} color The hex color
     */
    setColor(color) {
        this.color = color;
    }

    /**
     * Set color temperature
     *
     * @param {number} colorTemperature The color temperature
     */
    setColorTemperature(colorTemperature) {
        this.colorTemperature = parseFloat(colorTemperature);
    }

    /**
     * Generates a standard object format for tile
     *
     * @returns {Object} Standard object
     */
    tileFormat() {
        return {
            deviceTypes: this.deviceTypes,
            status: this.status,
            brightness: this.brightness,
            color: this.color,
            colorTemperature: this.colorTemperature
        };
    }
}

module.exports = {class:DeviceStatus};
