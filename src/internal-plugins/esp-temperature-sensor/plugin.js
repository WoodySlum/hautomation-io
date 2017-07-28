"use strict";

function loaded(api) {
    api.init();

    // Form
    class EspTemperatureSensorForm extends api.exported.TemperatureSensorForm {
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(EspTemperatureSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class EspTemperatureSensor extends api.exported.TemperatureSensor {
        constructor(api, id, configuration) {
            super(api, id, configuration);
            this.api.webAPI.register(this, this.api.webAPI.constants().POST, ":/esp/temperature/set/" + this.id + "/[value]/[vcc*]/", this.api.webAPI.Authentication().AUTH_NO_LEVEL);
        }

        /**
         * Process API callback
         *
         * @param  {[type]} apiRequest An APIRequest
         * @returns {Promise}  A promise with an APIResponse object
         */
        processAPI(apiRequest) {
            return new Promise((resolve, reject) => {
                this.setValue(apiRequest.data.value, apiRequest.data.vcc?parseFloat(apiRequest.data.vcc):null);
                resolve(this.api.webAPI.APIResponse(true, {success:true}));
            });
        }
    }

    api.sensorAPI.registerClass(EspTemperatureSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "esp-temperature-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "ESP temperature sensor",
    dependencies:["temperature-sensor"]
};
