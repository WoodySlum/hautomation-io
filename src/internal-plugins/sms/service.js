"use strict";

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    /**
     * This class conect to SMS using gammu
     * @class
     */
    class SMSService extends api.exported.Service.class {
        /**
         * Constructor
         *
         * @param  {SMS} plugin The SMS plugin
         * @param  {string} gammuConfigurationFile The gammue configuration file
         * @returns {SMSService}        The instance
         */
        constructor(plugin, gammuConfigurationFile) {
            super("sms", null, api.exported.Service.SERVICE_MODE_EXTERNAL, "gammu-smsd --config " + gammuConfigurationFile);
            this.plugin = plugin;
        }
    }

    return SMSService;
}

module.exports = loaded;
