"use strict";

/**
 * This class is a Plugin POJO
 * @class
 */
class PluginConf {
    /**
     * Constructor
     *
     * @param  {string} [path] The plugin path
     * @param  {boolean} [relative] The plugin path
     * @param  {string} [identifier=null] Plugin identifier
     * @param  {string} [version=null] Plugin version
     * @param  {boolean} [enable=true] `true` if plugin is enable, `false` otherwise
     * @param  {Array} [dependencies=[]] The dependencies (array of identifiers) list
     * @returns {PluginConf} The instance
     */
    constructor(path, relative, identifier = null, version = null, enable = true, dependencies = []) {
        this.path = path;
        this.relative = relative;
        this.identifier = identifier;
        this.version = version;
        this.dependencies = dependencies?dependencies:[];
        this.enable = (enable !== null)?enable:true;
    }

    /**
     * Transform json raw object to instance
     *
     * @param  {Object} data JSON object data
     * @returns {PluginConf} A User instance
     */
    json(data) {
        return new PluginConf(data.path, data.relative, data.identifier, data.version, data.enable, data.dependencies);
    }
}

const comparator = (pluginConf1, pluginConf2) => {
    return (pluginConf1.identifier == pluginConf2.identifier)?true:false;
};

module.exports = {class:PluginConf, comparator:comparator};
