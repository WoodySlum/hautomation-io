"use strict";
const Logger = require("./../../logger/Logger");
const fs = require("fs-extra");
const DateUtils = require("./../../utils/DateUtils");
const WebServices = require("./../../services/webservices/WebServices");
const APIResponse = require("./../../services/webservices/APIResponse");
const Authentication = require("./../authentication/Authentication");
const IotForm = require("./IotForm");

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

        // Web services
        this.webServices.registerAPI(this, WebServices.GET, IOT_MANAGER_AVAILABLE_GET, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, IOT_MANAGER_GET, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, IOT_MANAGER_POST, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.DELETE, IOT_MANAGER_DEL, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, IOT_MANAGER_FLASH, Authentication.AUTH_ADMIN_LEVEL);
    }

    registerLib(path, id, version = 0, form = null, ...inject) {
        if (!fs.existsSync(path + "/" + LIB_FOLDER)) {
            throw Error("'lib' folder does not exists in " + path);
        }

        if (!fs.existsSync(path + "/" + GLOBAL_LIB_FOLDER)) {
            throw Error("'global_lib' folder does not exists in " + path);
        }

        this.iotLibs[id] = {};
        this.iotLibs[id].lib = path + "/" + LIB_FOLDER;
        this.iotLibs[id].globalLib = path + "/" + GLOBAL_LIB_FOLDER;
        this.iotLibs[id].form = form;
        this.iotLibs[id].version = version;

        // Register form
        if (form) {
            this.formManager.register(form, ...inject);
        }

        Logger.info("IoT lib " + id + " registered");
    }

    getFormsForApp(id) {
        const results = [];
        if (this.iotAppExists(id) && this.iotApps[id].form) {
            if (this.iotApps[id].dependencies) {
                this.iotApps[id].dependencies.forEach((dependencyKey) => {
                    const dependency = this.iotLibs[dependencyKey];
                    if (dependency && dependency.form) {
                        results.push(dependency.form);
                    }
                });
            }

            results.push(this.iotApps[id].form);
        }
        return results;
    }

    registerApp(path, id, name, version, platform, board, framework, dependencies, form = null, ...inject) {
        if (!path || !id || !name || !version || !platform || !board || !framework) {
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

        this.iotApps[id] = {};
        this.iotApps[id].src = path + "/" + SRC_FOLDER;
        this.iotApps[id].lib = path + "/" + LIB_FOLDER;
        this.iotApps[id].globalLib = path + "/" + GLOBAL_LIB_FOLDER;
        this.iotApps[id].name = name;
        this.iotApps[id].version = version;
        this.iotApps[id].platform = platform;
        this.iotApps[id].board = board;
        this.iotApps[id].framework = framework;
        this.iotApps[id].form = form;
        this.iotApps[id].dependencies = dependencies;

        // Register form
        if (form) {
            this.formManager.register(form, ...inject);
        }

        Logger.info("Registered IoT app " + name);
        /*this.build(id, true, {}, (err, res) => {
            if (err) Logger.err(err.message);
            Logger.info(res);
        });*/
    }

    build(id, flash = false, config = null, cb) {
        const tmpDir = this.appConfiguration.cachePath + "iot-flash-" + DateUtils.class.timestamp() + "-" + id + "/";
        fs.ensureDirSync(tmpDir);

        // Copy dependencies
        this.iotApps[id].dependencies.forEach((dependencyId) => {
            const dependency = this.iotLibs[dependencyId];
            fs.copySync(dependency.lib, tmpDir + LIB_FOLDER);
            fs.copySync(dependency.globalLib, tmpDir + GLOBAL_LIB_FOLDER);
        });
        // Copy sources
        fs.copySync(this.iotApps[id].src, tmpDir + SRC_FOLDER);
        fs.copySync(this.iotApps[id].lib, tmpDir + LIB_FOLDER);
        fs.copySync(this.iotApps[id].globalLib, tmpDir + GLOBAL_LIB_FOLDER);

        // Configuration injection
        const baseConfiguration = {
                wifi:this.environmentManager.getWifiInfos(),
                ip:this.environmentManager.getLocalIp(),
                port:this.environmentManager.getLocalPort(),
                version:this.getVersion(id)
        };
        if (!config) {
            config = {};
        }

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

        this.writeDescriptor(tmpDir, id);

        this.installationManager.executeCommand("cd " + tmpDir + " ;platformio run -e " + this.iotApps[id].board + (flash?" -t upload":""), false, (error, stdout, stderr) => {
            if (error) {
                cb(error);
            } else {
                const firmwarePath = tmpDir + ".pioenvs/" + this.iotApps[id].board + "/firmware.elf";
                console.log(firmwarePath);
                if (fs.existsSync(firmwarePath)) {
                    cb(null, {firmwarePath:firmwarePath, stdout:stdout});
                } else {
                    cb(Error("No build found - " + stderr + stdout));
                }
            }
        });
    }

    writeDescriptor(folder, id) {
        let iniContent = "";
        iniContent += "[env:" + this.iotApps[id].board + "]\n";
        iniContent += "platform = " + this.iotApps[id].platform + "\n";
        iniContent += "board = " + this.iotApps[id].board + "\n";
        iniContent += "framework = " + this.iotApps[id].framework + "\n";
        iniContent += "\n";
        iniContent += "[platformio]\n";
        iniContent += "lib_dir = ./" + GLOBAL_LIB_FOLDER + "\n";
        iniContent += "lib_extra_dirs = ./" +LIB_FOLDER + "\n";
        fs.writeFileSync(folder + "platformio.ini", iniContent);
    }

    iotAppExists(id) {
        if (this.iotApps[id]) {
            return true;
        } else {
            return false;
        }
    }

    getVersion(id) {
        let version = 0;
        const app = this.getIotApp(id);
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

    getIotApp(id) {
        if (this.iotApps[id]) {
            return this.iotApps[id];
        } else {
            return null;
        }
    }

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
