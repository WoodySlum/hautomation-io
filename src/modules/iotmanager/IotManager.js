"use strict";
const fs = require("fs-extra");
const Logger = require("./../../logger/Logger");
const DateUtils = require("./../../utils/DateUtils");
const WebServices = require("./../../services/webservices/WebServices");
const APIResponse = require("./../../services/webservices/APIResponse");
const Authentication = require("./../authentication/Authentication");
const IotForm = require("./IotForm");
const IotsListForm = require("./IotsListForm");

const CONF_MANAGER_KEY = "iots";
const SRC_FOLDER = "src";
const LIB_FOLDER = "lib";
const GLOBAL_LIB_FOLDER = "global_lib";
const MAIN_FILE = "main.cpp";
const CONFIGURATION_PLACEHOLDER = "%config%";

const IOT_MANAGER_AVAILABLE_GET = ":/iot/available/get/";
const IOT_MANAGER_POST_BASE = ":/iot/set";
const IOT_MANAGER_POST = IOT_MANAGER_POST_BASE + "/[id*]/";
const IOT_MANAGER_GET = ":/iot/get/";
const IOT_MANAGER_DEL_BASE = ":/iot/del";
const IOT_MANAGER_DEL = IOT_MANAGER_DEL_BASE + "/[id*]/";

const IOT_MANAGER_FLASH_BASE = ":/iot/flash";
const IOT_MANAGER_FLASH = IOT_MANAGER_FLASH_BASE + "/[id]/";

/**
 * This class allows to manage iot apps
 * @class
 */
class IotManager {
    /**
     * Constructor
     *
     * @param  {AppConfiguration} appConfiguration The app configuration object
     * @param  {WebServices} webServices  The web services
     * @param  {InstallationManager} installationManager  The installation manager
     * @param  {FormManager} formManager  The form manager
     * @param  {EnvironmentManager} environmentManager  The environment manager
     * @param  {ConfManager} confManager    The configuration manager
     *
     * @returns {IotManager}              The instance
     */
    constructor(appConfiguration, webServices, installationManager, formManager, environmentManager, confManager) {
        this.webServices = webServices;
        this.appConfiguration = appConfiguration;
        this.installationManager = installationManager;
        this.formManager = formManager;
        this.environmentManager = environmentManager;
        this.confManager = confManager;
        this.iotApps = {};
        this.iotLibs = {};

        try {
            this.iots = this.confManager.loadData(Object, CONF_MANAGER_KEY, true);
        } catch(e) {
            Logger.warn(e.message);
        }

        if (!this.iots) {
            this.iots = [];
        }

        this.formManager.register(IotForm.class);
        this.registerIotsListForm();

        // Web services
        this.webServices.registerAPI(this, WebServices.GET, IOT_MANAGER_AVAILABLE_GET, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, IOT_MANAGER_GET, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, IOT_MANAGER_POST, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.DELETE, IOT_MANAGER_DEL, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, IOT_MANAGER_FLASH, Authentication.AUTH_ADMIN_LEVEL);
    }

    /**
     * Register an iots list form
     */
    registerIotsListForm() {
        const iotsName = [];
        const iotsId = [];
        this.iots.forEach((iot) => {
            iotsName.push(iot.name);
            iotsId.push(iot.id);
        });
        this.formManager.register(IotsListForm.class, iotsName, iotsId);
    }

    /**
     * Register an IoT library
     * A library folder should contain `global_lib` and `lib` folder, inside `path` parameter
     *
     * @param  {string} path        The library path
     * @param  {string} appId       An app identifier
     * @param  {int} [version=0] A version number
     * @param  {FormObject} [form=null] A form
     * @param  {...Object} inject      Some form injection parameters
     */
    registerLib(path, appId, version = 0, form = null, ...inject) {
        if (!fs.existsSync(path + "/" + LIB_FOLDER)) {
            throw Error("'lib' folder does not exists in " + path);
        }

        if (!fs.existsSync(path + "/" + GLOBAL_LIB_FOLDER)) {
            throw Error("'global_lib' folder does not exists in " + path);
        }

        this.iotLibs[appId] = {};
        this.iotLibs[appId].lib = path + "/" + LIB_FOLDER;
        this.iotLibs[appId].globalLib = path + "/" + GLOBAL_LIB_FOLDER;
        this.iotLibs[appId].form = form;
        this.iotLibs[appId].version = version;

        // Register form
        if (form) {
            this.formManager.register(form, ...inject);
        }

        Logger.info("IoT lib " + appId + " registered");
    }

    /**
     * Get the constants `constants().PLATFORMS`, `constants().BOARDS` and `constants().FRAMEWORKS`
     *
     * @returns {Object} The constants object
     */
    constants() {
        return {
            PLATFORMS:{
                ESP8266:"espressif8266_stage"
            },
            BOARDS:{
                NODEMCU:"nodemcuv2"
            },
            FRAMEWORKS:{
                ARDUINO:"arduino"
            }
        };
    }

    /**
     * Register an IoT library
     * An IoT app folder should contain `global_lib`, `lib` and `src` folder, inside `path` parameter.
     * A `main.cpp` file should be created under `src` folder.
     *
     * @param  {string} path           The application file path
     * @param  {string} appId          An app identifier
     * @param  {string} name           The app name
     * @param  {int} version           The application version number
     * @param  {string} platform       A platform
     * @param  {string} board          A board type
     * @param  {string} framework      A framework
     * @param  {Array} dependencies    The array of library dependencies. Can be en empty array or an array of library app identifiers.
     * @param  {Object} [options=null] A list of options injected in IoT configuration during flash sequence
     * @param  {FormObject} [form=null] A form
     * @param  {...Object} inject      Some form injection parameters
     */
    registerApp(path, appId, name, version, platform, board, framework, dependencies, options = null, form = null, ...inject) {
        if (!path || !appId || !name || !version || !platform || !board || !framework) {
            throw Error("Parameters are mandatory");
        }

        if (!fs.existsSync(path + "/" + SRC_FOLDER)) {
            throw Error("'src' folder does not exists in " + path);
        }

        if (!fs.existsSync(path + "/" + LIB_FOLDER)) {
            throw Error("'" + LIB_FOLDER + "' folder does not exists in " + path);
        }

        if (!fs.existsSync(path + "/" + GLOBAL_LIB_FOLDER)) {
            throw Error("'" + GLOBAL_LIB_FOLDER + "' folder does not exists in " + path);
        }

        if (!fs.existsSync(path + "/" + SRC_FOLDER + "/" + MAIN_FILE)) {
            throw Error("'" + path + "/" + SRC_FOLDER + "/' folder must contain a " + MAIN_FILE + " file");
        }

        dependencies.forEach((dependency) => {
            if (!this.iotLibs[dependency]) {
                throw Error("Dependency '" + dependency + "' not found for IoT app '" + name + "'");
            }
        });

        if (!form) {
            form = IotForm.class;
        }

        this.iotApps[appId] = {};
        this.iotApps[appId].src = path + "/" + SRC_FOLDER;
        this.iotApps[appId].lib = path + "/" + LIB_FOLDER;
        this.iotApps[appId].globalLib = path + "/" + GLOBAL_LIB_FOLDER;
        this.iotApps[appId].name = name;
        this.iotApps[appId].version = version;
        this.iotApps[appId].platform = platform;
        this.iotApps[appId].board = board;
        this.iotApps[appId].framework = framework;
        this.iotApps[appId].form = form;
        this.iotApps[appId].dependencies = dependencies;
        this.iotApps[appId].options = options?options:{};

        // Register form
        this.formManager.register(form, ...inject);

        if (dependencies) {
            const forms = [];
            dependencies.forEach((dependencyKey) => {
                const dependency = this.iotLibs[dependencyKey];
                if (dependency && dependency.form) {
                    forms.push(dependency.form);
                }
            });

            if (forms.length > 0) {
                this.formManager.addAdditionalFields(form, null, forms);
            }
        }

        Logger.info("Registered IoT app " + name);
    }

    /**
     * Build a firmware for a specific appId
     *
     * @param  {string}   appId         An app identifier
     * @param  {boolean}  [flash=false] `true` if USB flash sequence should be done after build, `false` otherwise
     * @param  {Object}   [config=null] A configuration injected to firmware
     * @param  {Function} cb            A callback `(error, result) => {}` called when firmware / flash is done. The result object contains 2 properties, `firmwarePath` for the firmware, `stdout` for the results
     */
    build(appId, flash = false, config = null, cb) {
        const tmpDir = this.appConfiguration.cachePath + "iot-flash-" + DateUtils.class.timestamp() + "-" + appId + "/";
        fs.ensureDirSync(tmpDir);

        // Copy dependencies
        this.iotApps[appId].dependencies.forEach((dependencyId) => {
            const dependency = this.iotLibs[dependencyId];
            fs.copySync(dependency.lib, tmpDir + LIB_FOLDER);
            fs.copySync(dependency.globalLib, tmpDir + GLOBAL_LIB_FOLDER);
        });
        // Copy sources
        fs.copySync(this.iotApps[appId].src, tmpDir + SRC_FOLDER);
        fs.copySync(this.iotApps[appId].lib, tmpDir + LIB_FOLDER);
        fs.copySync(this.iotApps[appId].globalLib, tmpDir + GLOBAL_LIB_FOLDER);

        // Configuration injection
        const baseConfiguration = {
            apiUrl:this.environmentManager.getLocalAPIUrl(),
            version:this.getVersion(appId),
            options:this.iotApps[appId].options
        };

        if (!config) {
            config = {};
        }

        // eslint-disable-next-line
        const jsonConfiguration = JSON.stringify(Object.assign(baseConfiguration, config)).replace(/\"/g, '\\"');

        try {
            const mainFilePath = tmpDir + SRC_FOLDER + "/" + MAIN_FILE;
            let mainContent = fs.readFileSync(mainFilePath, {encoding:"utf-8"});
            if (mainContent) {
                mainContent = mainContent.replace(CONFIGURATION_PLACEHOLDER, jsonConfiguration);
                fs.writeFileSync(mainFilePath, mainContent);
            }
        } catch(e) {
            Logger.err(e.message);
        }

        this.writeDescriptor(tmpDir, appId);

        this.installationManager.executeCommand("cd " + tmpDir + " ;platformio run -e " + this.iotApps[appId].board + (flash?" -t upload":""), false, (error, stdout, stderr) => {
            if (error) {
                cb(error);
            } else {
                const firmwarePath = tmpDir + ".pioenvs/" + this.iotApps[appId].board + "/firmware.bin";
                if (fs.existsSync(firmwarePath)) {
                    cb(null, {firmwarePath:firmwarePath, stdout:stdout});
                } else {
                    cb(Error("No build found - " + stderr + stdout));
                }
            }
        });
    }

    /**
     * Write platformio ini file descriptor
     *
     * @param  {string} folder The folder where file should be written
     * @param  {string} appId  An app identifier
     */
    writeDescriptor(folder, appId) {
        let iniContent = "";
        iniContent += "[env:" + this.iotApps[appId].board + "]\n";
        iniContent += "platform = " + this.iotApps[appId].platform + "\n";
        iniContent += "board = " + this.iotApps[appId].board + "\n";
        iniContent += "framework = " + this.iotApps[appId].framework + "\n";
        iniContent += "\n";
        iniContent += "[platformio]\n";
        iniContent += "lib_dir = ./" + GLOBAL_LIB_FOLDER + "\n";
        iniContent += "lib_extra_dirs = ./" + LIB_FOLDER + "\n";
        fs.writeFileSync(folder + "platformio.ini", iniContent);
    }

    /**
     * Check if an IoT app exists
     *
     * @param  {string} appId An app identifier
     * @returns {boolean}       `true` if the iot app is registered, `false` otherwise
     */
    iotAppExists(appId) {
        if (this.iotApps[appId]) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Get a version for a specific IoT app
     *
     * @param  {string} appId An app identifier
     * @returns {int}       A version number
     */
    getVersion(appId) {
        let version = 0;
        const app = this.getIotApp(appId);
        if (app) {
            version = app.version;
            app.dependencies.forEach((dependencyId) => {
                if (this.iotLibs[dependencyId]) {
                    version += this.iotLibs[dependencyId].version;
                }
            });
        }

        return version;
    }

    /**
     * Retrive an IoT app object
     *
     * @param  {string} appId An app identifier
     * @returns {Object}       An IoT app
     */
    getIotApp(appId) {
        if (this.iotApps[appId]) {
            return this.iotApps[appId];
        } else {
            return null;
        }
    }

    /**
     * Retrieve an IoT (not application, but configured instance)
     *
     * @param  {number} id An IoT identifier
     * @returns {Object}    An IoT configuration object
     */
    getIot(id) {
        let iotFound = null;
        this.iots.forEach((iot) => {
            if (iot.id === parseInt(id)) {
                iotFound = iot;
            }
        });

        return iotFound;
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        const self = this;
        if (apiRequest.route === IOT_MANAGER_AVAILABLE_GET) {
            return new Promise((resolve) => {
                const iots = [];
                Object.keys(this.iotApps).forEach((appKey) => {
                    iots.push({
                        identifier: appKey,
                        description:this.iotApps[appKey].name,
                        form: Object.assign(self.formManager.getForm(this.iotApps[appKey].form), {data:{iotApp:appKey}})
                    });
                });
                resolve(new APIResponse.class(true, iots));
            });
        } else if (apiRequest.route === IOT_MANAGER_GET) {
            return new Promise((resolve) => {
                const iots = [];
                self.iots.forEach((iot) => {
                    const iotApp = self.getIotApp(iot.iotApp);
                    iots.push({
                        identifier: iot.id,
                        name: iot.name,
                        icon: "F2DB",
                        iotApp: iotApp.name,
                        form:Object.assign(self.formManager.getForm(this.iotApps[iot.iotApp].form), {data:iot})
                    });
                });
                resolve(new APIResponse.class(true, iots));
            });
        } else if (apiRequest.route.startsWith(IOT_MANAGER_POST_BASE)) {
            return new Promise((resolve, reject) => {
                if (apiRequest.data) {
                    if (apiRequest.data.iotApp) {
                        if (self.getIotApp(apiRequest.data.iotApp)) {
                            // Set id
                            if (!apiRequest.data.id) {
                                apiRequest.data.id = DateUtils.class.timestamp();
                            } else {
                                apiRequest.data.id = parseInt(apiRequest.data.id);
                            }

                            self.iots = self.confManager.setData(CONF_MANAGER_KEY, apiRequest.data, self.iots, self.comparator);
                            self.registerIotsListForm();
                            resolve(new APIResponse.class(true, {success:true, id:apiRequest.data.id}));
                        } else {
                            reject(new APIResponse.class(false, {}, 8128, "Unexisting iot app found"));
                        }
                    } else {
                        reject(new APIResponse.class(false, {}, 8127, "No iot app attached"));
                    }
                } else {
                    reject(new APIResponse.class(false, {}, 8126, "No data request"));
                }

            });
        } else if (apiRequest.route.startsWith(IOT_MANAGER_DEL_BASE)) {
            return new Promise((resolve, reject) => {
                try {
                    self.confManager.removeData(CONF_MANAGER_KEY, {id:parseInt(apiRequest.data.id)}, self.iots, self.comparator);
                    self.registerIotsListForm();
                    resolve(new APIResponse.class(true, {success:true}));
                } catch(e) {
                    reject(new APIResponse.class(false, {}, 8129, e.message));
                }
            });
        } else if (apiRequest.route.startsWith(IOT_MANAGER_FLASH_BASE)) {
            return new Promise((resolve, reject) => {
                const iot = self.getIot(apiRequest.data.id);
                if (iot) {
                    if (self.getIotApp(iot.iotApp)) {
                        this.build(iot.iotApp, true, iot, (error, details) => {
                            if (!error) {
                                resolve(new APIResponse.class(true, {success:true, details:details.stdout}));
                            } else {
                                reject(new APIResponse.class(false, {}, 8129, error.message));
                            }
                        });

                    } else {
                        reject(new APIResponse.class(false, {}, 8128, "Unexisting iot app found"));
                    }
                } else {
                    reject(new APIResponse.class(false, {}, 8130, "Unexisting iot found"));
                }
            });
        }
    }

    /**
     * Compare IoT data
     *
     * @param  {Object} iotData1 Iot data 1
     * @param  {Object} iotData2 Iot data 2
     * @returns {boolean}             True if id is the same, false otherwise
     */
    comparator(iotData1, iotData2) {
        return (iotData1.id === iotData2.id);
    }
}

module.exports = {class:IotManager};
