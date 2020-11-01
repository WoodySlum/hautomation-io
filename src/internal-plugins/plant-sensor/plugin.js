"use strict";

/**
 * Loaded function
 *
 * @param  {PluginAPI} api The api
 */
function loaded(api) {
    api.init();

    /**
     * Plant form sensor
     * @class
     */
    class PlantSensorForm extends api.exported.HumiditySensorForm {

        /**
         * Convert JSON data to object
         *
         * @param  {Object} data Some data
         * @returns {PlantSensorForm}      An instance
         */
        json(data) {
            super.json(data);
        }
    }

    api.sensorAPI.registerForm(PlantSensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class PlantSensor extends api.exported.HumiditySensor {
        /**
         * Plant sensor class (should be extended)
         *
         * @param  {PluginAPI} api                                                           A plugin api
         * @param  {number} [id=null]                                                        An id
         * @param  {Object} [configuration=null]                                             The configuration for sensor
         * @returns {EspPlantSensor}                                                       The instance
         */
        constructor(api, id, configuration) {
            // Credits : Freepik / https://www.flaticon.com/free-icon/watering-can_3043714
            const svg = "<svg id=\"Capa_1\" enable-background=\"new 0 0 508.198 508.198\" height=\"512\" viewBox=\"0 0 508.198 508.198\" width=\"512\" xmlns=\"http://www.w3.org/2000/svg\"><g><path d=\"m508.031 250.253c-1.148-13.722-8.14-26.312-19.182-34.541l-29.92-22.297v-49.205c0-4.142-3.358-7.5-7.5-7.5s-7.5 3.358-7.5 7.5v38.027l-15-11.179v-99.643c0-10.69-4.507-21.002-12.366-28.292-7.966-7.388-18.33-11.001-29.185-10.187-19.979 1.506-35.629 18.685-35.629 39.108v41.496l-15-11.178v-30.947c0-14.769 5.906-28.536 16.629-38.765 10.711-10.218 24.752-15.463 39.55-14.764 28.599 1.349 51 25.255 51 54.425v39.937c0 4.142 3.358 7.5 7.5 7.5s7.5-3.358 7.5-7.5v-39.937c0-37.193-28.68-67.681-65.293-69.408-18.923-.892-36.903 5.817-50.611 18.894-13.72 13.088-21.275 30.709-21.275 49.619v19.768l-49.144-34.69c-8.833-6.232-19.975-7.271-29.807-2.78s-16.341 13.594-17.413 24.35l-8.437 84.681-22.087 23.475c-2.838 3.017-2.694 7.763.323 10.602 3.017 2.838 7.763 2.694 10.602-.323l86.264-91.687c5.377-5.714 14.176-6.489 20.468-1.799l13.912 10.368-139.606 148.379-11.205-13.133c-5.119-6-4.903-14.855.5-20.599l7.754-8.242c2.838-3.017 2.694-7.763-.323-10.602s-7.764-2.694-10.602.323l-7.754 8.242c-10.655 11.324-11.079 28.784-.987 40.612l58.642 68.733h-87.389c-3.56-20.135-21.172-35.481-42.313-35.481h-12.072c-7.411 0-13.44 6.029-13.44 13.44v97.655c0 7.411 6.029 13.44 13.44 13.44h12.073c21.141 0 38.753-15.346 42.313-35.481h133.097l30.116 35.298c8.808 10.324 21.639 16.467 35.204 16.854.456.013.91.02 1.364.02 13.08 0 25.677-5.363 34.744-14.839l124.872-130.5c9.519-9.947 14.321-23.524 13.173-37.247zm-386.902 122.916c0 15.429-12.552 27.981-27.981 27.981h-10.514v-94.536h10.513c15.429 0 27.981 12.552 27.981 27.981v38.574zm245.62-301.125c0-12.623 9.557-23.231 21.757-24.15 6.641-.504 12.987 1.71 17.857 6.227 4.809 4.46 7.566 10.763 7.566 17.293v88.465l-47.18-35.16zm-85.624 22.488-47.318 50.292 6.504-65.274c.537-5.386 3.796-9.944 8.72-12.194 4.922-2.25 10.503-1.728 14.925 1.392l26.796 18.908c-3.536 1.599-6.819 3.892-9.627 6.876zm-144.996 271.137v-23.574h99.518l20.112 23.574zm347.891-88.537-124.872 130.5c-6.455 6.746-15.491 10.464-24.843 10.196-5.944-.17-11.679-1.951-16.629-5.053l124.204-130.446c2.856-3 2.74-7.747-.26-10.604-2.999-2.855-7.747-2.739-10.604.26l-124.189 130.43-110.209-129.175 141.918-150.839 137.406 102.4-22.862 24.011c-2.856 3-2.74 7.747.26 10.604 1.452 1.382 3.313 2.068 5.171 2.068 1.981 0 3.958-.78 5.433-2.328l23.032-24.189c3.456 4.812 5.603 10.514 6.107 16.538.79 9.441-2.514 18.782-9.063 25.627z\"/><path d=\"m343.837 252.006 6.059-6.059c11.709-11.71 11.709-30.763 0-42.472l-6-6c-2.162-2.162-5.037-3.353-8.094-3.353s-5.932 1.191-8.094 3.353l-8.572 8.572c-4.613 4.613-7.401 10.367-8.379 16.362-10.737-4.232-23.447-2.02-32.114 6.646l-20.386 20.387c-4.462 4.462-4.463 11.724 0 16.188l14.857 14.857c5.823 5.823 13.472 8.734 21.122 8.734 7.649 0 15.298-2.911 21.121-8.734l17.874-17.874 22.356 22.356c1.464 1.464 3.384 2.197 5.303 2.197s3.839-.732 5.303-2.197c2.929-2.929 2.929-7.678 0-10.606zm-14.094-35.353 6.059-6.059 3.488 3.487c5.861 5.861 5.861 15.398 0 21.259l-6.059 6.059-3.488-3.488c-5.861-5.861-5.861-15.397 0-21.258zm-24.993 53.227c-5.798 5.796-15.232 5.797-21.03 0l-12.344-12.345 17.874-17.874c5.797-5.797 15.231-5.798 21.03 0l12.344 12.345z\"/><path d=\"m46.048 376.333c-8.849 0-16.048 7.199-16.048 16.048v16.269c0 4.142 3.358 7.5 7.5 7.5s7.5-3.358 7.5-7.5v-16.269c0-.578.47-1.048 1.048-1.048 4.142 0 7.5-3.358 7.5-7.5s-3.358-7.5-7.5-7.5z\"/><path d=\"m37.5 434.381c-4.142 0-7.5 3.358-7.5 7.5v53.425c0 4.142 3.358 7.5 7.5 7.5s7.5-3.358 7.5-7.5v-53.425c0-4.142-3.358-7.5-7.5-7.5z\"/><path d=\"m46.048 321.881c-25.391 0-46.048 20.657-46.048 46.048v129.945c0 4.142 3.358 7.5 7.5 7.5s7.5-3.358 7.5-7.5v-129.945c0-17.12 13.928-31.048 31.048-31.048 4.142 0 7.5-3.358 7.5-7.5s-3.358-7.5-7.5-7.5z\"/></g></svg>";
            super(api, id, configuration);
            this.icon = svg;
            this.type = "PLANT-SENSOR";
            this.addClassifier(null, 10, 10);
            this.addClassifier(11, 30, 30);
            this.addClassifier(31, 50, 50);
            this.addClassifier(51, 80, 80);
            this.addClassifier(81, null, 100);
        }

        /**
         * Set a value and store in database
         *
         * @param {number} value      A value
         * @param {number} [vcc=null] A voltage level
         * @param  {Function} [cb=null] A callback with an error parameter, called when done. Used for testing only.
         * @param {number} [timestamp=null] A timestamp
         */
        setValue(value, vcc = null, cb = null, timestamp = null) {
            super.setValue(Math.round(value), vcc, cb, timestamp);
        }
    }

    api.sensorAPI.registerClass(PlantSensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "plant-sensor",
    version: "0.0.0",
    category: "sensor",
    description: "Soil hygrometer plant sensor",
    dependencies:["humidity-sensor"]
};
