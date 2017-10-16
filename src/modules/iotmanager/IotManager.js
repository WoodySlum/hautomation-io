"use strict";
const Logger = require("./../../logger/Logger");
const fs = require("fs-extra");
const DateUtils = require("./../../utils/DateUtils");

const SRC_FOLDER = "src";
const LIB_FOLDER = "lib";
const GLOBAL_LIB_FOLDER = "global_lib";
const MAIN_FILE = "main.cpp";
const CONFIGURATION_PLACEHOLDER = "%config%";

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
     * @returns {IotManager}              The instance
     */
    constructor(appConfiguration, webServices, installationManager, formManager, environmentManager) {
        this.webServices = webServices;
        this.appConfiguration = appConfiguration;
        this.installationManager = installationManager;
        this.formManager = formManager;
        this.environmentManager = environmentManager;
        this.iotApps = {};
        this.iotLibs = {};
    }

    registerLib(path, id, form = null, ...inject) {
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
        this.build(id, true, {}, (err, res) => {
            if (err) Logger.err(err.message);
            Logger.info(res);
        });
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
                port:this.environmentManager.getLocalPort()
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
}

module.exports = {class:IotManager};
