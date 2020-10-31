"use strict";
/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * This class is extended by waterLeak sensors
     * @class
     */
    class WaterLeakSensorForm extends api.exported.SensorForm {
        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {WaterLeakSensorForm}      An instance
         */
        json(data) {
            return new WaterLeakSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(WaterLeakSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class WaterLeakSensor extends api.exported.Sensor {
        /**
         * Presence sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {WaterLeakSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            // Credits : Thos Icons / https://www.flaticon.com/free-icon/flood_798302
            const svg = "<svg version=\"1.1\" id=\"Capa_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"	 viewBox=\"0 0 512 512\" style=\"enable-background:new 0 0 512 512;\" xml:space=\"preserve\"><g>	<g>		<g>			<path d=\"M10.667,384.003c17.813,0,26.208,4.385,35.927,9.458c10.667,5.563,22.76,11.875,45.813,11.875				c23.042,0,35.125-6.313,45.792-11.875c9.719-5.073,18.104-9.458,35.917-9.458s26.208,4.385,35.927,9.458				c10.667,5.563,22.75,11.875,45.792,11.875c23.052,0,35.146-6.313,45.813-11.875c9.719-5.073,18.115-9.458,35.938-9.458				c17.854,0,26.271,4.385,36.01,9.458c10.677,5.563,22.781,11.875,45.865,11.875c23.083,0,35.188-6.313,45.865-11.875				c9.74-5.073,18.156-9.458,36.01-9.458c5.896,0,10.667-4.771,10.667-10.667c0-5.896-4.771-10.667-10.667-10.667				c-23.083,0-35.188,6.313-45.865,11.875c-2.512,1.309-4.948,2.56-7.469,3.714V234.669h32c4.469,0,8.458-2.781,10-6.969				c1.552-4.188,0.333-8.896-3.063-11.792l-224-192c-3.979-3.438-9.896-3.438-13.875,0l-224,192				c-3.396,2.896-4.615,7.604-3.063,11.792c1.542,4.188,5.531,6.969,10,6.969h32v143.619c-2.542-1.163-5-2.422-7.531-3.743				c-10.667-5.563-22.75-11.875-45.802-11.875C4.771,362.669,0,367.44,0,373.336C0,379.232,4.771,384.003,10.667,384.003z				 M320,364.245c-12.272,2.193-20.711,6.379-28.229,10.299c-9.719,5.073-18.115,9.458-35.938,9.458				c-17.813,0-26.198-4.385-35.917-9.458c-7.451-3.885-15.827-8.021-27.917-10.23v-86.978h128V364.245z M60.833,213.336L256,46.055				l195.167,167.281h-13.833c-5.896,0-10.667,4.771-10.667,10.667v159.533c-2.327,0.191-4.479,0.467-7.208,0.467				c-17.854,0-26.271-4.385-36.01-9.458c-10.027-5.224-21.658-10.917-42.115-11.613v-96.262c0-5.896-4.771-10.667-10.667-10.667				H181.333c-5.896,0-10.667,4.771-10.667,10.667v96.241c-20.619,0.647-32.275,6.384-42.344,11.634				c-9.719,5.073-18.104,9.458-35.917,9.458c-2.678,0-4.784-0.275-7.073-0.46v-159.54c0-5.896-4.771-10.667-10.667-10.667H60.833z\"				/>			<path d=\"M501.333,448.003c-23.083,0-35.188,6.313-45.865,11.875c-9.74,5.073-18.156,9.458-36.01,9.458				c-17.854,0-26.271-4.385-36.01-9.458c-10.677-5.563-22.781-11.875-45.865-11.875c-23.052,0-35.146,6.313-45.813,11.875				c-9.719,5.073-18.115,9.458-35.938,9.458c-17.813,0-26.198-4.385-35.917-9.458c-10.667-5.563-22.75-11.875-45.802-11.875				c-23.042,0-35.125,6.313-45.792,11.875c-9.719,5.073-18.104,9.458-35.917,9.458c-17.823,0-26.219-4.385-35.938-9.458				c-10.667-5.563-22.75-11.875-45.802-11.875C4.771,448.003,0,452.773,0,458.669c0,5.896,4.771,10.667,10.667,10.667				c17.813,0,26.208,4.385,35.927,9.458c10.667,5.563,22.76,11.875,45.813,11.875c23.042,0,35.125-6.313,45.792-11.875				c9.719-5.073,18.104-9.458,35.917-9.458s26.208,4.385,35.927,9.458c10.667,5.563,22.75,11.875,45.792,11.875				c23.052,0,35.146-6.313,45.813-11.875c9.719-5.073,18.115-9.458,35.938-9.458c17.854,0,26.271,4.385,36.01,9.458				c10.677,5.563,22.781,11.875,45.865,11.875c23.083,0,35.188-6.313,45.865-11.875c9.74-5.073,18.156-9.458,36.01-9.458				c5.896,0,10.667-4.771,10.667-10.667C512,452.773,507.229,448.003,501.333,448.003z\"/>		</g>	</g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>";
            super(api, id, "WATER-LEAK", configuration, svg, 0);
            this.chartType = api.exported.Sensor.constants().CHART_TYPE_BAR;
            this.aggregationMode = api.exported.Sensor.constants().AGGREGATION_MODE_MAX;
            this.unit = api.translateAPI.t("waterLeak.unit.tick");
            this.addClassifier(null, 0.99, 0);
            this.addClassifier(1, null, 1);
        }
    }

    api.sensorAPI.registerClass(WaterLeakSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "water-leak-sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Water leak sensor base plugin",
    dependencies:["sensor"]
};
