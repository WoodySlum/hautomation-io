"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by throughput sensors
     * @class
     */
    class PresenceSensorForm extends api.exported.SensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {PresenceSensorForm}      An instance
         */
        json(data) {
            return new PresenceSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(PresenceSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class PresenceSensor extends api.exported.Sensor {
        /**
         * Presence sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {PresenceSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            // Credits : SBTS2018 / https://www.flaticon.com/premium-icon/sensor_2143136
            const svg = "<svg id=\"Layer_1\" enable-background=\"new 0 0 124 124\" height=\"512\" viewBox=\"0 0 124 124\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"m62 68.544c-9.491 0-18.979-2.449-27.444-7.348-.618-.358-.998-1.018-.998-1.732v-50.386c0-.714.38-1.373.998-1.732 16.929-9.796 37.961-9.796 54.89 0 .618.358.998 1.018.998 1.732v50.386c0 .714-.38 1.373-.998 1.732-8.464 4.899-17.957 7.348-27.446 7.348zm-24.443-10.247c15.181 8.331 33.706 8.331 48.885 0v-48.049c-15.181-8.331-33.705-8.331-48.886 0v48.049z\"/><path d=\"m62 59.592c-6.046 0-11.991-1.555-17.192-4.497-.628-.356-1.016-1.021-1.016-1.741v-25.243c0-.721.388-1.386 1.016-1.741 5.201-2.942 11.146-4.497 17.192-4.497s11.991 1.555 17.192 4.497c.628.356 1.016 1.021 1.016 1.741v5.088c0 1.105-.896 2-2 2s-2-.896-2-2v-3.897c-4.391-2.276-9.165-3.428-14.208-3.428s-9.816 1.153-14.208 3.428v22.861c4.391 2.276 9.165 3.428 14.208 3.428s9.816-1.153 14.208-3.428v-5.253c0-1.105.896-2 2-2s2 .896 2 2v6.443c0 .721-.388 1.386-1.016 1.741-5.201 2.943-11.146 4.498-17.192 4.498z\"/><path d=\"m78.208 42.795c-1.104 0-2-.896-2-2v-2.202c0-1.105.896-2 2-2s2 .896 2 2v2.202c0 1.105-.896 2-2 2z\"/><path d=\"m61.555 18.345c-1.104 0-2-.896-2-2v-5.392c0-1.105.896-2 2-2s2 .896 2 2v5.392c0 1.104-.896 2-2 2z\"/><path d=\"m61.999 124c-15.289 0-29.656-6.32-40.456-17.797-.757-.805-.719-2.071.086-2.828.805-.759 2.07-.719 2.827.085 10.035 10.666 23.368 16.539 37.542 16.539 14.175 0 27.509-5.874 37.544-16.541.757-.803 2.022-.843 2.827-.085.804.757.843 2.023.086 2.828-10.798 11.478-25.166 17.799-40.456 17.799z\"/><path d=\"m61.999 105.388c-11.197 0-21.717-4.627-29.623-13.028-.757-.805-.718-2.071.086-2.828.804-.759 2.07-.719 2.827.085 7.141 7.59 16.627 11.77 26.709 11.77 10.083 0 19.569-4.18 26.711-11.771.757-.804 2.023-.843 2.827-.085.804.757.843 2.023.086 2.828-7.905 8.401-18.425 13.029-29.623 13.029z\"/><path d=\"m61.999 86.775c-7.105 0-13.778-2.933-18.79-8.259-.757-.805-.718-2.071.086-2.828.805-.759 2.07-.719 2.827.085 4.248 4.515 9.886 7.001 15.876 7.001 5.992 0 11.632-2.487 15.88-7.003.758-.806 2.023-.843 2.827-.087.804.757.843 2.023.086 2.828-5.011 5.329-11.685 8.263-18.792 8.263z\"/></svg>";
            super(api, id, "PRESENCE", configuration, svg, 0);
            this.chartType = api.exported.Sensor.constants().CHART_TYPE_BAR;
            this.aggregationMode = api.exported.Sensor.constants().AGGREGATION_MODE_SUM;
            this.unit = api.translateAPI.t("presence.unit.seconds");
            this.addUnitAggregation(api.translateAPI.t("presence.unit.minutes"), 1 * 60);
            this.addUnitAggregation(api.translateAPI.t("presence.unit.hours"), 1 * 60 * 60);
            this.addUnitAggregation(api.translateAPI.t("presence.unit.days"), 1 * 60 * 60 * 24);
            this.addUnitAggregation(api.translateAPI.t("presence.unit.months"), 1 * 60 * 60 * 24 * 30);

            this.addClassifier(null, 0.99, 0);
            this.addClassifier(1, null, 1);
        }
    }

    api.sensorAPI.registerClass(PresenceSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "presence-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Presence Sensor base plugin",
    dependencies:["sensor"]
};
