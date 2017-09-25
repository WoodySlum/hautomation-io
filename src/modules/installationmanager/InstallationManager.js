"use strict";

const childProcess = require("child_process");
const os = require("os");
const sha256 = require("sha256");

const Logger = require("./../../logger/Logger");
const DateUtils = require("./../../utils/DateUtils");
const HautomationCore = require("./../../HautomationCore");

const CONF_KEY = "installer";

/**
 * This class allows to manage external installation
 * @class
 */
class InstallationManager {
    /**
     * Constructor
     *
     * @param  {ConfManager} confManager    The configuration manager
     * @param  {EventEmitter} eventBus    The global event bus
     * @returns {InstallationManager}             The instance
     */
    constructor(confManager, eventBus) {
        this.confManager = confManager;
        this.commandList = [];
        this.eventBus = eventBus;
        try {
            this.commandDone = this.confManager.loadData(Object, CONF_KEY, true);
        } catch(e) {
            this.commandDone = {};
            Logger.warn(e.message);
        }
    }

    /**
     * Register a command to be executed for a specific version
     *
     * @param  {string}  currentVersion The module's version
     * @param  {string|Array}  [arch="*"]     The architecture ('arm', 'arm64', 'ia32', 'mips', 'mipsel', 'ppc', 'ppc64', 's390', 's390x', 'x32', 'x64', and 'x86'). Can be `*` for all arch, or an array of architectures
     * @param  {string}  command        A command
     * @param  {boolean} [sudo=false]    True if command should be executed as sudo, false otherwise. The Hautomation process owner user should be in `sudo` group without password.
     * @param  {boolean} [wait=true]    True if command is executed synchronously, false otherwise
     * @param  {boolean} [skipError=false]    True if command fails should continue, false for retrying
     */
    register(currentVersion, arch = "*", command, sudo = false, wait = true, skipError = false) {
        const key = sha256(currentVersion + command);
        this.commandList.push({key:key, version:currentVersion, command:command, sudo:sudo, wait:wait, arch: arch, skipError: skipError});
    }

    /**
     * Execute a command. Can throw an error if wait is `true`
     *
     * @param  {string}  command     The command
     * @param  {boolean} [wait=true] True if command is executed synchronously, false otherwise
     * @param  {Function}  [cb=null]   A callback (only if wait parameter is false) : `(error, stdout, stderr) => {}`
     * @returns {Object}              An object result if wait is `true`
     */
    executeCommand(command, wait = true, cb = null) {
        Logger.info("Executing command => " + command);
        if (!wait) {
            childProcess.exec(command, {}, (error, stdout, stderr) => {
                if (cb) {
                    cb(error, stdout, stderr);
                }
            });
            return null;
        } else {
            return childProcess.execSync(command, {encoding:"utf-8"});
        }
    }

    /**
     * Execute all registered commands
     */
    execute() {
        const needed = [];
        this.commandList.forEach((command) => {
            if (!this.isAlreadyExecuted(command.key) && this.isValidForArchitecture(command.arch, os.arch())) {
                needed.push(command);
            }
        });

        let i = 0;
        needed.forEach((command) => {
            // Execute
            let c = (command.sudo?"sudo ":"") + command.command;
            Logger.info("Installation manager, executing command : " + c);
            if (!command.wait) {
                this.executeCommand(c, false, (error, stdout, stderr) => {
                    Logger.verbose("Execution results of : " + c);
                    if (error) {
                        Logger.err(error.message);
                    }

                    if (stdout) {
                        Logger.verbose(stdout);
                    }

                    if (stderr) {
                        Logger.err(stderr);
                    }

                    if (!error && !stderr || command.skipError) {
                        this.commandDone[command.key] = DateUtils.class.timestamp();
                        this.commandDone = this.confManager.setData(CONF_KEY, this.commandDone);
                    }

                    i++;
                    this.restart(i, needed.length);
                });
            } else {
                let res;
                try {
                    res = this.executeCommand(c, true);
                    Logger.verbose("Execution results of : " + c);
                    Logger.info(res);
                    this.commandDone[command.key] = DateUtils.class.timestamp();
                    this.commandDone = this.confManager.setData(CONF_KEY, this.commandDone);
                } catch (e) {
                    Logger.err(e.message);
                    if (command.skipError) {
                        this.commandDone[command.key] = DateUtils.class.timestamp();
                        this.commandDone = this.confManager.setData(CONF_KEY, this.commandDone);
                    }
                }
                i++;
                this.restart(i, needed.length);
            }
        });
    }

    /**
     * Check if the command has been already executed
     *
     * @param  {string}  key The sha256 key
     * @returns {boolean}     True if command has been already executed, false otherwise
     */
    isAlreadyExecuted(key) {
        const doneKeys = Object.keys(this.commandDone);
        return doneKeys.indexOf(key) === -1?false:true;
    }

    /**
     * Check if the command is valid for the architecture
     *
     * @param  {string}  arch The architecture
     * @param  {string}  currentArch The current architecture
     * @returns {boolean}     True if command is valid, false otherwise
     */
    isValidForArchitecture(arch, currentArch) {
        let r = false;
        if (arch instanceof Array) {
            arch.forEach((dArch) => {
                if (dArch.toLowerCase() === currentArch.toLowerCase()) {
                    r = true;
                }
            });
        } else {
            if (arch === "*") {
                r = true;
            }
        }
        return r;
    }

    /**
     * Process Hautomation when all commands has been done
     *
     * @param  {number} i  The current comment indice
     * @param  {number} nb The max number of commands to execute
     */
    restart(i, nb) {
        if (i === nb) {
            // Dispatch event
            if (this.eventBus) {
                this.eventBus.emit(HautomationCore.EVENT_RESTART, this);
            }
        }
    }
}

module.exports = {class:InstallationManager};
