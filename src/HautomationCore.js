"use strict";
var fs = require("fs");
var path = require("path");
var Logger = require("./logger/Logger");
var ServicesManager = require("./modules/servicesmanager/ServicesManager");
var ThreadsManager = require("./modules/threadsmanager/ThreadsManager");
var WebServices = require("./services/webservices/WebServices");
var Authentication = require("./modules/authentication/Authentication");
var ConfManager = require("./modules/confmanager/ConfManager");
var UserManager = require("./modules/usermanager/UserManager");
var AlarmManager = require("./modules/alarmmanager/AlarmManager");
var PluginsManager = require("./modules/pluginsmanager/PluginsManager");
var DeviceManager = require("./modules/devicemanager/DeviceManager");
var DbManager = require("./modules/dbmanager/DbManager");
var TranslateManager = require("./modules/translatemanager/TranslateManager");
var FormManager = require("./modules/formmanager/FormManager");
const CONFIGURATION_FILE = "data/config.json";
var AppConfiguration = require("./../data/config.json");


class Foo {
    constructor() {
        /**
         * @Property("b");
         * @Type("string");
         * @Title("Foo");
         * @Required(true);
         * @Maxlength(5);
         * @Default("FooBar");
         */
        this.b = null;

        /**
         * @Property("a");
         * @Type("integer");
         * @Title("const.test");
         * @Required(true);
         */
        this.a = null;

        /**
         * @Property("e");
         * @Type("number");
         * @Range([1, 10]);
         * @Title("const.test");
         * @Required(true);
         */
        this.e = null;

        /**
         * @Property("c");
         * @Type("string");
         * @Title("Bar");
         * @Enum(["foo", "bar"]);
         * @EnumNames(["Foo", "Bar"]);
         * @Required(false);
         */
        this.c = null;

        /**
         * @Property("d");
         * @Type("string");
         * @Title("Bar");
         * @Enum("getValues");
         * @EnumNames(["WOODY", "Bar"]);
         * @Required(false);
         */
        this.d = null;

        /**
         * @Property("f");
         * @Type("boolean");
         * @Title("I'm a boolean");
         * @Default(true);
         */
        this.f = null;

        /**
         * @Property("g");
         * @Type("string");
         * @Title("I'm a radio");
         * @Enum(["a", "b"]);
         * @EnumNames(["Option A", "Option B"]);
         * @Display("radio")
         */
        this.g = null;

        /**
         * @Property("h");
         * @Type("string");
         * @Title("I'm disabled");
         * @Disabled(true);
         * @Value("FooBar")
         */
        this.h = null;

        /**
         * @Property("i");
         * @Type("string");
         * @Title("I'm read only");
         * @Readonly(true);
         * @Value("FooBar")
         */
        this.i = null;

        /**
         * @Property("j");
         * @Type("string");
         * @Title("I'm hidden");
         * @Hidden(true);
         * @Value("FooBar")
         */
        this.j = null;

        /**
         * @Property("k");
         * @Type("string");
         * @Title("I'm a textarea");
         * @Display("textarea");
         * @Value("FooBar")
         */
        this.k = null;

        /**
         * @Property("l");
         * @Type("string");
         * @Title("Bar");
         * @Enum("getValues");
         * @EnumNames(["WOODY", "Bar"]);
         * @Display("checkbox");
         * @Unique(true)
         * @Required(false);
         */
        this.l = null;

        /**
         * @Property("m");
         * @Type("string");
         * @Title("I'm a color picker");
         * @Display("color");
         * @Value("#FF0000")
         */
        this.m = null;

        /**
         * @Property("n");
         * @Type("date");
         * @Title("Pick a date");
         */
        this.n = null;

        /**
         * @Property("o");
         * @Type("datetime");
         * @Title("Pick a date time");
         */
        this.o = null;
    }

    static getValues(...inject) {
        return [inject[0], inject[1]];
    }
}

class Bar extends Foo {
    constructor() {
        /**
         * @Property("zz");
         * @Type("datetime");
         * @Title("Another extended form");
         */
        this.o = null;

        /**
         * @Property("zzi");
         * @Type("objects");
         * @Cl("BarFoo");
         * @Title("Pick sub objects !");
         */
        this.zzi = null;

        /**
         * @Property("zzj");
         * @Type("object");
         * @Cl("BarFoo");
         * @Title("Pick only one sub object !");
         */
        this.zzj = null;
    }
}

class FooBar extends Bar {
    constructor() {

    }
}

class BarFoo {
    constructor() {
        /**
         * @Property("xo");
         * @Type("string");
         * @Title("Another extended form");
         */
        this.xo = null;
    }
}

/**
 * The main class for core.
 * @class
 */
class HautomationCore {
    /**
     * Constructor
     *
     * @returns {HautomationCore} The instance
     */
    constructor() {
        // Load main configuration
        this.configurationLoader();

        // Translation
        this.translateManager = new TranslateManager.class(AppConfiguration.lng);
        this.translateManager.addTranslations(__dirname + "/.."); // Base translations

        // Form
        this.formManager = new FormManager.class(this.translateManager);
        this.formManager.register(BarFoo);
        this.formManager.register(Foo, "WOODY", "SLUM");
        this.formManager.register(Bar);
        this.formManager.register(FooBar);
        require("fs").writeFileSync("/Users/smizrahi/Desktop/form.json", JSON.stringify(this.formManager.getForm(FooBar), null, 2));
        // Threads
        this.threadsManager = new ThreadsManager.class();

        // Services
        // Web services and API
        this.webServices = new WebServices.class(AppConfiguration.port, AppConfiguration.ssl.port, AppConfiguration.ssl.key, AppConfiguration.ssl.cert);

        // Init modules
        // Db manager
        this.dbManager = new DbManager.class(AppConfiguration);

        // Services manager
        this.servicesManager = new ServicesManager.class(this.threadsManager);

        // ConfManager module
        this.confManager = new ConfManager.class(AppConfiguration);
        // UserManager module
        this.userManager = new UserManager.class(this.confManager);
        // Authentication module
        this.authentication = new Authentication.class(this.webServices, this.userManager);
        // Alarm module
        this.alarmManager = new AlarmManager.class(this.confManager, this.webServices);
        // Plugins manager module
        this.pluginsManager = new PluginsManager.class(this.confManager, this.webServices, this.servicesManager, this.dbManager, this.translateManager);
        // Device manager module
        this.deviceManager = new DeviceManager.class(this.confManager, this.pluginsManager, this.webServices);

        // Add services to manager
        this.servicesManager.add(this.webServices);
    }

    /**
     * Start Hautomation core
     */
    start() {
        Logger.info("Starting core");
        try {
            this.servicesManager.start();
        } catch(e) {
            Logger.err("Could not start services : " + e.message);
        }
    }

    /**
     * Stop automation core
     */
    stop() {
        Logger.info("Stopping core");
        try {
            this.servicesManager.stop();
            this.dbManager.close();
        } catch(e) {
            Logger.err("Could not stop services : " + e.message);
        }
    }

    /**
     * Try to overload configuration
     */
    configurationLoader() {
        let confPath = path.resolve() + "/" + CONFIGURATION_FILE;
        if (fs.existsSync(confPath)) {
            Logger.info("Main configuration found, overloading");
            AppConfiguration = JSON.parse(fs.readFileSync(confPath));
        } else {
            Logger.warn("No configuration found, using default");
        }
    }
}

module.exports = HautomationCore;
