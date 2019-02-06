var FormObject = require("./../formmanager/FormObject");

/**
 * This class provides ip scan form
 * @class
 */
class IpScanForm extends FormObject.class {
    /**
     * Constructor
     *
     * @param  {number} [id=null]                  An identifier
     * @param  {string} [ip=null]                Ip
     * @param  {string} [freetext=null]                A free text
     * @param {string} [freetextHidden=null] Hidden free text for dependency form
     * @returns {IpScanForm}                            The instance
     */
    constructor(id = null, ip = null, freetext = null, freetextHidden = null) {
        super(id);

        /**
         * @Property("ip");
         * @Type("string");
         * @Title("form.ip.scan");
         * @Enum("getValues");
         * @EnumNames("getTitles");
         */
        this.ip = ip;

        /**
         * @Property("freetext");
         * @Type("string");
         * @Title("form.ip.scan.freetext");
         * @DependencyField("ip");
         * @DependencyValues("freetext");
         * @Default("-");
         */
        this.freetext = freetext;

        /**
         * @Property("freetextHidden");
         * @Type("string");
         * @DependencyField("ip");
         * @DependencyValues("getValuesWithoutFreetext");
         * @Hidden(true);
         */
        this.freetextHidden = freetextHidden;

    }

    /**
     * Get values
     *
     * @param  {...Array} inject Injection
     * @returns {Array}        Result
     */
    static getValues(...inject) {
        return inject[0];
    }

    /**
     * Get values without freetext
     *
     * @param  {...Array} inject Injection
     * @returns {Array}        Result
     */
    static getValuesWithoutFreetext(...inject) {
        return inject[2];
    }

    /**
     * Get titles
     *
     * @param  {...Array} inject Injection
     * @returns {Array}        Result
     */
    static getTitles(...inject) {
        return inject[1];
    }

    /**
     * Convert json data
     *
     * @param  {Object} data Some key / value data
     * @returns {IpScanForm}      A form object
     */
    json(data) {
        return new IpScanForm(data.id, data.ip, data.freetext, data.freetextHidden);
    }
}

module.exports = {class:IpScanForm};
