var FormObject = require("./../modules/formmanager/FormObject");

/**
 * This class provides a room select box form part
 * @class
 */
class RoomForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]   An identifier
     * @param  {string} [room=null] A room name
     * @returns {RoomForm}             The instance
     */
    constructor(id = null, room = null) {
        super(id);

        /**
         * @Property("room");
         * @Type("string");
         * @Display("typeahead-new");
         * @Title("room.form.name");
         * @Enum("getRoomsLabels");
         * @EnumNames("getRoomsLabels");
         */
        this.room = room;
    }

    /**
     * Form injection method
     *
     * @param  {...Object} inject The rooms labels list array
     * @returns {Array}        An array of icons labels
     */
    static getRoomsLabels(...inject) {
        return inject[0];
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {FormObject}      A form object
     */
    json(data) {
        return new RoomForm(data.id, data.room);
    }
}

module.exports = {class:RoomForm};
