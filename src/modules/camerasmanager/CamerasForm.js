var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for one device
 * @class
 */
class CamerasForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {number} [cameraId=null]                A camera identifier
     * @returns {CamerasForm}                            The instance
     */
    constructor(id = null, cameraId = null) {
        super(id);

        /**
         * @Property("cameraId");
         * @Type("string");
         * @Title("form.camera.title");
         * @Enum("getCameraIds");
         * @EnumNames("getCameraNames");
         * @Display("checkbox");
         */
        this.cameraId = cameraId;
    }

    /**
     * Cameras id injection
     *
     * @param  {...Object} inject Inject parameters
     * @returns {Array}        An array of ids
     */
    static getCameraIds(...inject) {
        return [inject[0]];
    }

    /**
     * Cameras name injection
     *
     * @param  {...Object} inject Inject parameters
     * @returns {Array}        An array of names
     */
    static getCameraNames(...inject) {
        return [inject[1]];
    }


    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {CamerasForm}      A form object
     */
    json(data) {
        return new CamerasForm(data.id, data.cameraId);
    }
}

module.exports = {class:CamerasForm};
