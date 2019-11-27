var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides a form for one device
 * @class
 */
class CameraRecordScenarioForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {string} [camera=null]  A camera
     * @param  {number} [timer=10]  A camera timer in seconds
     * @returns {CameraRecordScenarioForm}                            The instance
     */
    constructor(id = null, camera = null, timer = 10) {
        super(id);

        /**
         * @Property("camera");
         * @Type("number");
         * @Title("camera.scenario.camera");
         * @Enum("getCameras");
         * @EnumNames("getCamerasNames");
         */
        this.camera = camera;

        /**
         * @Property("timer");
         * @Type("number");
         * @Title("camera.scenario.timer");
         * @Default(10);
         * @Range([10, 360, 10]);
         */
        this.timer = timer;
    }

    /**
     * Get the usernames
     *
     * @param  {...Array} inject Injection
     * @returns {Array}        The cameras ids
     */
    static getCameras(...inject) {
        return inject[0];
    }

    /**
     * Get the names
     *
     * @param  {...Array} inject Injection
     * @returns {Array}        The cameras names
     */
    static getCamerasNames(...inject) {
        return inject[1];
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {CameraRecordScenarioForm}      A form object
     */
    json(data) {
        return new CameraRecordScenarioForm(data.id, data.camera, data.timer);
    }
}

module.exports = {class:CameraRecordScenarioForm};
