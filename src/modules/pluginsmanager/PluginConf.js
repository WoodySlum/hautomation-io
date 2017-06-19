"use strict";

/**
 * This class is a Plugin POJO
 * @class
 */
class PluginConf {
    /**
     * Constructor
     *
     * @param  {string} [identifier=null] Plugin identifier
     * @param  {string} [version=null] Plugin version
     * @returns {User} The instance
     */
    constructor(identifier = null, version = null) {
        this.identifier = identifier;
        this.version = version;
    }

    /**
     * Transform json raw object to instance
     *
     * @param  {Object} data JSON object data
     * @returns {User} A User instance
     */
    json(data) {
        return new PluginConf(data.identifier, data.version);
    }
}

const comparator = (pluginConf1, pluginConf2) => {
    return (pluginConf1.identifier == pluginConf2.identifier)?true:false;
};

module.exports = {class:PluginConf, comparator:comparator};
