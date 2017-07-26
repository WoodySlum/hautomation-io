"use strict";

function loaded(api) {
    api.init();

    /**
     * This class is overloaded by sensors
     * @class
     */
    class EspTemperatureSensor extends api.exported.TemperatureSensor {
        constructor(api) {
            super(api);
        }
    }

    class EspTemperatureSensorForm extends api.exported.TemperatureSensorForm {
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(EspTemperatureSensorForm);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "esp-temperature-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "ESP temperature sensor",
    dependencies:["temperature-sensor"]
};
