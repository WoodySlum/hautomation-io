"use strict";

/**
 * Utility class for conversion
 * @class
 */
class Convert {
    static convertProperties(inputObject) {
        let output = {};
        inputObject.forEach((p) => {
            output[p.key] = p.value;
        });
        return output;
    }
}

module.exports = Convert;
