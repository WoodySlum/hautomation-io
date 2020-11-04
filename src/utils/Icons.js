"use strict";
const icons = require("./../../res/icons/icons-svg.json");

/**
 * Utility class for icons
 * @class
 */
class Icons {

    /**
     * Return the svg icons list
     *
     * @returns {Object} Svg icons object
     */
    static iconsSvg() {
        return icons;
    }

    /**
     * Return the svg icons list
     *
     * @returns {Object} Svg icons object
     */
    static icons() {
        const r = {};
        Object.keys(icons).forEach((key) => {
            r[key] = key;
        });

        return r;
    }

    /**
     * Return a list of icons (key / value)
     *
     * @returns {Object} The icons under Key / Value format
     */
    static list() {
        return this.icons();
    }
}

module.exports = {class:Icons, icons:Icons.icons(), iconsSvg:Icons.iconsSvg()};
