"use strict";
const Logger = require("./../../logger/Logger");
const PluginsManager = require("./../pluginsmanager/PluginsManager");
const WebServices = require("./../../services/webservices/WebServices");
const APIResponse = require("./../../services/webservices/APIResponse");
const Authentication = require("./../authentication/Authentication");

const CONF_MANAGER_KEY = "sensors";
const SENSORS_MANAGER_AVAILABLE_GET = ":/sensors/available/get/";
const SENSORS_MANAGER_POST_BASE = ":/sensor/set";
const SENSORS_MANAGER_POST = SENSORS_MANAGER_POST_BASE + "/[id*]/";

/**
 * This class allows to manage sensors
 * @class
 */
class SensorsManager {
    /**
     * Constructor
     *
     * @param  {PluginsManager} pluginsManager A plugin manager
     * @param  {EventEmitter} eventBus    The global event bus
     * @param  {WebServices} webServices    The web services
     * @param  {FormManager} formManager    The form manager
     * @param  {ConfManager} confManager    The configuration manager
     * @returns {SensorsManager}                       The instance
     */
    constructor(pluginsManager, eventBus, webServices, formManager, confManager) {
        this.pluginsManager = pluginsManager;
        this.webServices = webServices;
        this.formManager = formManager;
        this.confManager = confManager;
        try {
            this.sensors = this.confManager.loadData(Object, CONF_MANAGER_KEY, true);
        } catch(e) {
            Logger.info(e.message);
            this.sensors= [];
        }

        const self = this;
        eventBus.on(PluginsManager.EVENT_LOADED, (pluginsManager) => {
            self.pluginsLoaded(pluginsManager, self);
        });

        // Web services
        this.webServices.registerAPI(this, WebServices.GET, SENSORS_MANAGER_AVAILABLE_GET, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, SENSORS_MANAGER_POST, Authentication.AUTH_ADMIN_LEVEL);
    }

    /**
     * Called automatically when plugins are loaded. Used in separate methods for testing.
     * Initially, this method wad used in contructor.
     *
     * @param  {PluginsManager} pluginsManager THe plugins manager instance
     * @param  {SensorsManager} context        The context (self, this, etc ...)
     */
    pluginsLoaded(pluginsManager, context) {
        context.pluginsManager = pluginsManager;
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        if (apiRequest.route === SENSORS_MANAGER_AVAILABLE_GET) {
            return new Promise((resolve) => {
                const sensors = [];
                this.pluginsManager.getPluginsByCategory("sensor", false).forEach((sensor) => {
                    if (sensor.sensorAPI.form) {
                        sensors.push({
                            identifier: sensor.identifier,
                            description: sensor.description,
                            form:this.formManager.getForm(sensor.sensorAPI.form)
                        });
                    }
                });
                resolve(new APIResponse.class(true, sensors));
            });
        } else if (apiRequest.route.startsWith(SENSORS_MANAGER_POST_BASE)) {
            console.log(apiRequest.data);
        }
    }

    /**
     * Compare sensor data
     *
     * @param  {Object} sensorData1 Sensor data 1
     * @param  {Object} sensorData2 Sensor data 2
     * @return {Boolean}             True if id is the same, false otherwise
     */
    comparator(sensorData1, sensorData2) {
        return (sensorData1.id === sensorData2.id);
    }
}

module.exports = {class:SensorsManager};
