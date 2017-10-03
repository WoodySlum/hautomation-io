"use strict";
const sha256 = require("sha256");
const Logger = require("./../../logger/Logger");
const FormConfiguration = require("./../formconfiguration/FormConfiguration");
const EnvironmentForm = require("./EnvironmentForm");
const Tile = require("./../dashboardmanager/Tile");
const Icons = require("./../../utils/Icons");
const DayNightScenarioForm = require("./DayNightScenarioForm");

/**
 * This class allows to manage house environment
 * @class
 */
class EnvironmentManager {
    /**
     * Constructor
     *
     * @param  {AppConfiguration} appConfiguration The app configuration object
     * @param  {ConfManager} confManager  A configuration manager
     * @param  {FormManager} formManager  A form manager
     * @param  {WebServices} webServices  The web services
     * @param  {DashboardManager} dashboardManager The dashboard manager
     * @param  {TranslateManager} translateManager    The translate manager
     * @param  {ScenarioManager} scenarioManager    The scenario manager
     * @returns {EnvironmentManager}              The instance
     */
    constructor(appConfiguration, confManager, formManager, webServices, dashboardManager, translateManager, scenarioManager) {
        this.appConfiguration = appConfiguration;
        this.formConfiguration = new FormConfiguration.class(confManager, formManager, webServices, "environment", false, EnvironmentForm.class);
        this.dashboardManager = dashboardManager;
        this.formManager = formManager;
        this.translateManager = translateManager;
        this.scenarioManager = scenarioManager;
        this.formConfiguration.data = this.formConfiguration.data?this.formConfiguration.data:{};
        this.registeredElements = {};
        this.registerTile();
        this.formManager.register(DayNightScenarioForm.class);
        this.scenarioManager.register(DayNightScenarioForm.class, null, "daynight.scenario.trigger.title");
    }

    /**
     * Register for day/night notifications
     *
     * @param  {Function} cb            A callback triggered when day/night information is received. Example : `(isNight) => {}`
     * @param  {string} id            An identifier
     */
    registerDayNightNotifications(cb, id = null) {
        const index = sha256(cb.toString() + id);
        this.registeredElements[index] = cb;
    }

    /**
     * Unegister for day/night notifications
     *
     * @param  {Function} cb             A callback triggered when day/night information is received. Example : `(isNight) => {}`
     * @param  {string} id            An identifier
     */
    unregisterDayNightNotifications(cb, id = null) {
        const index = sha256(cb.toString() + id);
        if (this.registeredElements[index]) {
            delete this.registeredElements[index];
        } else {
            Logger.warn("Element not found");
        }
    }

    /**
     * Register day / night tile
     */
    registerTile() {
        let tileTitle = this.translateManager.t("environment.day");
        let icon = "sun-1";
        if (this.isNight()) {
            tileTitle = this.translateManager.t("environment.night");
            icon = "moon";
        }
        const tile = new Tile.class(this.dashboardManager.themeManager, "day-night", Tile.TILE_INFO_ONE_TEXT, Icons.class.list()[icon], null, tileTitle, null, null, null, null, 200);
        this.dashboardManager.registerTile(tile);
    }

    /**
     * Return the home's coordinates
     *
     * @returns {Object} The coordinates
     */
    getCoordinates() {
        return this.appConfiguration.home;
    }

    /**
     * Dispatch day or night changes
     */
    dispatchDayNightChange() {
        // Dispatch callback
        Object.keys(this.registeredElements).forEach((registeredKey) => {
            this.registeredElements[registeredKey](this.isNight());
        });

        // Dispatch to scenarios
        this.scenarioManager.getScenarios().forEach((scenario) => {
            if (scenario.DayNightScenarioForm && scenario.DayNightScenarioForm.day && !this.isNight()) {
                this.scenarioManager.triggerScenario(scenario);
            }

            if (scenario.DayNightScenarioForm && scenario.DayNightScenarioForm.night && this.isNight()) {
                this.scenarioManager.triggerScenario(scenario);
            }
        });
    }

    /**
     * Set day
     */
    setDay() {
        if (this.isNight()) {
            Logger.info("Day mode enabled");
            this.formConfiguration.data.day = true;
            this.formConfiguration.save();
            this.registerTile();

            this.dispatchDayNightChange();
        }
    }

    /**
     * Set night
     */
    setNight() {
        if (!this.isNight()) {
            Logger.info("Night mode enabled");
            this.formConfiguration.data.day = false;
            this.formConfiguration.save();
            this.registerTile();

            this.dispatchDayNightChange();
        }
    }

    /**
     * Is it night ?
     *
     * @returns {boolean} `true` if night mode, otherwise `false`
     */
    isNight() {
        return !this.formConfiguration.data.day;
    }
}

module.exports = {class:EnvironmentManager};
