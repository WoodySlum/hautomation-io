"use strict";

const HOUR_TRIGGER = 18;

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    api.init();

    /**
     * This class manage trash reminder sub form
     * @class
     */
    class TrashReminderSubform extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id The identifier
         * @param  {number} day The day numbered
         * @param  {number} weekMode The week mode
         * @param  {string} name The alertname
         * @returns {TrashReminderSubform}        The instance
         */
        constructor(id, day, weekMode, name) {
            super(id);
            /**
             * @Property("day");
             * @Type("number");
             * @Title("trash.reminder.configuration.day");
             * @Enum([1,2,3,4,5,6,0]);
             * @EnumNames(["time.scenario.form.day.monday", "time.scenario.form.day.tuesday", "time.scenario.form.day.wednesday", "time.scenario.form.day.thursday", "time.scenario.form.day.friday", "time.scenario.form.day.saturday", "time.scenario.form.day.sunday"]);
             */
            this.day = day;

            /**
             * @Property("weekMode");
             * @Type("number");
             * @Title("trash.reminder.configuration.weekMode");
             * @Enum([0, 1, 2]);
             * @EnumNames(["trash.reminder.configuration.weekMode.all", "trash.reminder.configuration.weekMode.pair", "trash.reminder.configuration.weekMode.unpair"]);
             */
            this.weekMode = weekMode;

            /**
             * @Property("name");
             * @Type("string");
             * @Title("trash.reminder.configuration.name");
             */
            this.name = name;
        }

        /**
         * Convert a json object to TrashReminderSubform object
         *
         * @param  {Object} data Some data
         * @returns {TrashReminderSubform}      An instance
         */
        json(data) {
            return new TrashReminderSubform(data.id, data.day, data.weekMode, data.name);
        }
    }

    /**
     * This class manage trash reminder form
     * @class
     */
    class TrashReminderForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id The identifier
         * @param  {objects} reminders The reminders
         * @returns {TrashReminderForm}        The instance
         */
        constructor(id, reminders) {
            super(id);
            /**
             * @Property("reminders");
             * @Type("objects");
             * @Title("trash.reminder.configuration.reminders");
             * @Cl("TrashReminderSubform")
             */
            this.reminders = reminders;
        }

        /**
         * Convert a json object to TrashReminderSubform object
         *
         * @param  {Object} data Some data
         * @returns {TrashReminderForm}      An instance
         */
        json(data) {
            return new TrashReminderForm(data.id, data.reminders);
        }
    }

    // Register the rflink form
    api.configurationAPI.register(TrashReminderSubform, []);
    api.configurationAPI.register(TrashReminderForm, []);

    /**
     * This class manage Trash reminders
     * @class
     */
    class TrashReminders {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The core APIs
         *
         * @returns {TrashReminders} The instance
         */
        constructor(api) {
            this.api = api;

            this.api.timeEventAPI.register((self) => {
                const configuration = self.api.configurationAPI.getConfiguration();
                if (configuration && configuration.reminders && configuration.reminders.length > 0) {
                    const d = new Date();
                    const currentDayNumber = d.getDay();
                    const onejan = new Date(d.getFullYear(), 0, 1);
                    const weekNumber = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
                    const isPair = (weekNumber % 2 === 0);
                    const hour = d.getHours();

                    configuration.reminders.forEach((reminderConfiguration) => {
                        if (hour === HOUR_TRIGGER
                            && reminderConfiguration.day === currentDayNumber
                            && (reminderConfiguration.weekMode === 0
                            || (reminderConfiguration.weekMode === 1 && isPair))
                            || (reminderConfiguration.weekMode === 2 && !isPair)) {
                            self.api.messageAPI.sendMessage("*", self.api.translateAPI.t("trash.reminder.configuration.message", reminderConfiguration.name));
                        }

                    });
                }
            }, this, this.api.timeEventAPI.constants().EVERY_HOURS);
        }
    }

    api.registerInstance(new TrashReminders(api));
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "trash-reminder",
    version: "0.0.0",
    category: "misc",
    description: "Receive a reminder when you should taking out the trash",
    dependencies:[],
    classes:[]
};
