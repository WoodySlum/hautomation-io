"use strict";
const Logger = require("./../../logger/Logger");
const fs = require("fs-extra");
const DateUtils = require("./../../utils/DateUtils");

const SRC_FOLDER = "src";
const LIB_FOLDER = "lib";
const GLOBAL_LIB_FOLDER = "global_lib";

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
     * @returns {IotManager}              The instance
     */
    constructor(appConfiguration, webServices, installationManager, formManager) {
        this.webServices = webServices;
        this.appConfiguration = appConfiguration;
        this.installationManager = installationManager;
        this.formManager = formManager;
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

        if (!fs.existsSync(path + "/" + SRC_FOLDER + "/main.cpp") && !fs.existsSync(path + "/" + SRC_FOLDER + "/main.c")) {
            throw Error("'" + path + "/" + SRC_FOLDER + "/' folder must contain a main.cpp/main.c file");
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
        /*this.build(id, false, (err, res) => {
            Logger.err(err);
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
        iniContent += "lib_dir = ./global_dir\n";
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
