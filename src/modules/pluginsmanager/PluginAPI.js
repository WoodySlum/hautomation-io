"use strict";

const PrivateProperties = require("./PrivateProperties");
var WebAPI = require("./publicapis/WebAPI");

/**
 * This class is an interface for plugins
 * @class
 */
class PluginsAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {WebServices} webServices     The web services
    //  * @param  {string} identifier       Plugin identifier
    //  * @param  {version} version          Plugin version
    //  * @param  {string} [description=""] Plugin description
    //  * @returns {PluginAPI}                  Insntance
    //  */
    constructor(webServices, identifier, version, description = "") {
        PrivateProperties.createPrivateState(this);

        PrivateProperties.oprivate(this).identifier = identifier;
        PrivateProperties.oprivate(this).version = version;
        PrivateProperties.oprivate(this).description = description;
        this.webAPI = new WebAPI.class(webServices);
    }
    /* eslint-enable */
}

module.exports = {class:PluginsAPI};
