"use strict";

/**
 * Form objects
 * This class must be extended
 * @class
 */
class FormObject {
    /**
     * Constructor
     *
     * @param  {number} [id=null] An identifier
     * @returns {FormObject}           The instance
     */
    constructor(id = null) {
        /**
         * @Property("id");
         * @Type("number");
         * @Hidden(true);
         */
        if (id) {
            this.id = Number(id);
        } else {
            this.id = null;
        }
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {FormObject}      A form object
     */
    json(data) {
        return new FormObject(data.id);
    }

}

module.exports = {class:FormObject};
