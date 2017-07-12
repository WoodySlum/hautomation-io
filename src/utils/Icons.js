"use strict";
const iconsDescriptor = require("./../../res/icons/config.json");

/**
 * Utility class for icons
 * @class
 */
class Icons {
    /**
     * Return a list of icons (key / value)
     *
     * @returns {Object} The icons under Key / Valye format
     */
    static list() {
        const glyphs = iconsDescriptor.glyphs.sort((glyph1, glyph2) => {
            return glyph1.css > glyph2.css;
        });

        const icons = {};
        glyphs.forEach((glyph) => {
            icons[glyph.css] = glyph.code;
        });

        return icons;
    }

    /**
     * Return the raw icons object
     *
     * @returns {Object} Raw icons object
     */
    static raw() {
        return iconsDescriptor;
    }
}

module.exports = {class:Icons};
