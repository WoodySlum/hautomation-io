"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    // test
    class Titi extends api.exported.FormObject.class {
        constructor(id = null, demo = null) {
            super(id);

            /**
             * @Property("demo");
             * @Title("super demo !");
             * @Type("string");
             */
            this.demo = demo;
        }

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {EspTemperatureSensorForm}      An instance
         */
        json(data) {

        }
    }

    api.iotAPI.registerLib("app", "esp8266", Titi);


}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "esp8266",
    version: "0.0.0",
    category: "iot",
    description: "ESP8266 base libraries"
};
