"use strict";

function loaded(api) {
    api.init();

    /**
     * This class should not be implemented but only inherited.
     * This class is used for sensors database
     * @class
     */
    class DbSensor extends api.exported.DbObject.class {
        /**
         * Radio table descriptor
         *
         * @param  {DbHelper} [dbHelper=null] A database helper
         * @param  {...Object} values          The values
         * @returns {DbObject}                 A database object
         */
        constructor(dbHelper = null, ...values) {
            super(dbHelper, ...values);

            /**
             * @Property("value");
             * @Type("number");
             * @Version("0.0.0");
             */
            this.value;

            /**
             * @Property("sensorId");
             * @Type("string");
             * @Version("0.0.0");
             */
            this.sensorId;

            /**
             * @Property("vcc");
             * @Type("double");
             * @Version("0.0.0");
             */
            this.vcc;
        }
    }

    class SensorForm extends api.exported.FormObject.class {
        constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor) {
            super(id);

            this.plugin = plugin;

            /**
             * @Property("name");
             * @Title("sensor.name");
             * @Type("string");
             * @Required(true);
             */
            this.name = name;

            /**
             * @Property("dashboard");
             * @Title("sensor.dashboard");
             * @Type("boolean");
             * @Default(true);
             */
            this.dashboard = dashboard;

            /**
             * @Property("statistics");
             * @Title("sensor.statistics");
             * @Type("boolean");
             * @Default(true);
             */
            this.statistics = statistics;

            /**
             * @Property("dashboardColor");
             * @Title("sensor.dashboard.color");
             * @Type("string");
             * @Display("color");
             */
            this.dashboardColor = dashboardColor;

            /**
             * @Property("statisticsColor");
             * @Title("sensor.statistics.color");
             * @Type("string");
             * @Display("color");
             */
            this.statisticsColor = statisticsColor;
        }

        json(data) {
            return new SensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor);
        }
    }

    api.sensorAPI.registerForm(SensorForm);

    /**
     * This class is overloaded by sensors
     * @class
     */
    class Sensor {
        constructor(api) {
            this.api = api;
            this.api.databaseAPI.register(DbSensor);
            this.dbHelper = this.api.databaseAPI.dbHelper(DbSensor);
        }

        setValue(value, vcc = null) {
            const dbObject = new DbSensor(this.dbHelper, value, vcc);
            dbObject.save();
        }
    }

    api.exportClass(Sensor);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "sensor",
    version: "0.0.0",
    category: "sensor-base",
    description: "Sensor base plugin"
};
