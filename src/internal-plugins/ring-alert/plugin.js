"use strict";

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    api.init();

    /**
     * This class manage ring alert form
     * @class
     */
    class RingAlertForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id The identifier
         * @param  {objects} radioEvents The radio events
         * @param  {objects} cameras The cameras
         * @returns {RingAlertForm}        The instance
         */
        constructor(id, radioEvents, cameras) {
            super(id);

            /**
             * @Property("radioEvents");
             * @Type("objects");
             * @Cl("RadioScenarioForm");
             * @Title("ring.alert.radio.events");
             */
             this.radioEvents = radioEvents;

             /**
              * @Property("cameras");
              * @Type("objects");
              * @Cl("CamerasListForm");
              * @Title("ring.alert.cameras");
              */
              this.cameras = cameras;
        }

        /**
         * Convert a json object to TrashReminderSubform object
         *
         * @param  {Object} data Some data
         * @returns {RingAlertForm}      An instance
         */
        json(data) {
            return new RingAlertForm(data.id, data.radioEvents, data.cameras);
        }
    }

    // Register the ring alert form
    api.configurationAPI.register(RingAlertForm);

    /**
     * This class manage ring alerts
     * @class
     */
    class RingAlert {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The core APIs
         *
         * @returns {RingAlert} The instance
         */
        constructor(api) {
            this.api = api;
            var self = this;
            this.api.radioAPI.register((radioObject) => {
                const config = self.api.configurationAPI.getConfiguration();
                let detected = false;
                if (config && config.radioEvents && config.radioEvents.length > 0) {
                    config.radioEvents.forEach((radioFormObject) => {
                        if (self.api.radioAPI.compareFormObject(radioFormObject, radioObject)) {
                            detected = true;
                        }
                    });
                }

                if (detected) {
                    self.api.messageAPI.sendMessage("*", self.api.translateAPI.t("ring.alert.message"));
                    if (config && config.cameras && config.cameras.length > 0) {
                        config.cameras.forEach((cameraId) => {
                            self.api.cameraAPI.getImage(cameraId.identifier, (err, data, mime) => {
                                if (!err && data) {
                                    self.api.messageAPI.sendMessage("*", null, "cameras", null, data.toString("base64"));
                                }
                            });
                        });
                    }
                }

            }, "ring-alert");
        }
    }

    api.registerInstance(new RingAlert(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "ring-alert",
    version: "0.0.0",
    category: "misc",
    description: "Receive a notification when someone rings at door",
    dependencies:[],
    classes:[]
};
