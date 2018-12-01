/**
 * This class provides is a POJO for device status
 * @class
 */
class DeviceStatus {
    /**
     * constructor
     *
     * @param {int} status     The status
     * @param {int} brightness The brightness
     * @param {string} color      The color
     */
    constructor(status, brightness, color) {
        this.status = status;
        this.brightness = brightness;
        this.color = color;
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
        this.brightness = brightness;
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
     * Generates a standard object format for tile
     *
     * @returns {Object} Standard object
     */
    tileFormat() {
        return {
            status: this.status,
            brightness: this.brightness,
            color: this.color
        };
    }
}

module.exports = {class:DeviceStatus};
