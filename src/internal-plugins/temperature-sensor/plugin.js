"use strict";

function loaded(api) {
    api.init();

    /**
     * This class is overloaded by sensors
     * @class
     */
    class TemperatureSensor extends api.exported.Sensor {
        constructor(api) {
            super(api);
        }
    }

    api.exportClass(TemperatureSensor);

    class TemperatureSensorForm extends api.exported.SensorForm {
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor, unit) {
            super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);

            /**
             * @Property("unit");
             * @Title("sensor.temperature.unit");
             * @Enum(["cel", "far"]);
             * @EnumNames(["Celsius", "Fahrenheit"]);
             * @Type("string");
             * @Required(true);
             */
            this.unit = unit;
        }

        json(data) {
            return new TemperatureSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor, data.unit);
        }
    }

    api.sensorAPI.registerForm(TemperatureSensorForm);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "temperature-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Temperature Sensor base plugin",
    dependencies:["sensor"]
};
