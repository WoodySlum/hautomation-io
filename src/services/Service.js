"use strict";

const cp = require("child_process");
var Logger = require("./../logger/Logger");

const STOPPED = 0;
const RUNNING = 1;

const SERVICE_MODE_CLASSIC = 0;
const SERVICE_MODE_THREADED = 1;
const SERVICE_MODE_EXTERNAL = 2;

const ERROR_EXTERNAL_COMMAND_UNDEF = "Undefined external command";
const ERROR_UNDEFINED_THREADS_MANAGER = "Undefined threads manager";

/**
 * This class should not be implemented but only inherited.
 * This class is used for services, start, stop, ...
 * @class
 */
class Service {
    /**
     * Constructor
     *
     * @param  {string} name                        The service identifier
     * @param  {ThreadManager} [threadsManager=null]       The thread manager, mandatory if using SERVICE_MODE_THREADED mode service
     * @param  {int} [mode=SERVICE_MODE_CLASSIC] The service running mode : SERVICE_MODE_CLASSIC, SERVICE_MODE_THREADED, SERVICE_MODE_EXTERNAL
     * @param  {string} [command=null]              The external service command to execute, in case of SERVICE_MODE_EXTERNAL
     * @returns {Service}                             The instance
     */
    constructor(name, threadsManager = null, mode = SERVICE_MODE_CLASSIC, command = null) {
        this.status = STOPPED;

        this.threadsManager = threadsManager;
        this.name = name;
        this.delegates = [];
        this.mode = mode;
        this.command = command;
        this.pid = -1;
        this.childProcess = null;
    }

    /**
     * Start the service
     */
    start() {
        try {
            if (this.status == STOPPED) {
                if (this.mode === SERVICE_MODE_EXTERNAL) {
                    this.startExternal();
                } else if (this.mode === SERVICE_MODE_THREADED) {
                    this.startThreaded();
                }
                this.status = RUNNING;
            } else {
                throw Error("Service " + this.name + " already started");
            }
        } catch(e) {
            Logger.err(e);
        }
    }

    /* eslint-disable */

    /**
     * Run function prototype threaded
     * Should be overloaded by service
     *
     * @param  {Object} data    A data passed as initial value
     * @param  {Function} send Send a message to parent process
     */
    run(data, send) {

    }

    /**
     * Retrieve data from process
     * Should be overloaded by service
     *
     * @param  {Object} data    A data passed as initial value
     */
    threadCallback(data) {

    }

    /* eslint-enable */

    /**
     * Send data to sub process
     *
     * @param  {string} event       An event
     * @param  {Object} [data=null] A data
     */
    send(event, data = null) {
        this.threadsManager.send(this.name, event, data);
    }

    /**
     * Internal
     * Start in threaded mode (sub process)
     */
    startThreaded() {
        if (this.threadsManager) {
            this.threadsManager.run(this.run, this.name, {test:"abc"}, (tData) => {
                Logger.warn(tData);
            });
            this.pid = this.threadsManager.getPid(this.name);
        } else {
            throw Error(ERROR_UNDEFINED_THREADS_MANAGER);
        }
    }

    /**
     * Internal
     * Stop in threaded mode (sub process)
     */
    stopThreaded() {
        try {
            this.threadsManager.kill(this.name);
        } catch(e) {
            Logger.err("Could not kill process for service " + this.name);
        }
    }

    /**
     * Internal
     * Start an external command
     */
    startExternal() {
        if (this.command) {
            const r = cp.exec(this.command, function callback(error, stdout, stderr){
                if (error) {
                    if (error.signal !== "SIGTERM") {
                        Logger.err(error);
                    }
                }
                if (stderr) Logger.err(stderr);
            });
            this.pid = r.pid;
            this.childProcess = r;
            Logger.info("PID : " + this.pid);
        } else {
            throw Error(ERROR_EXTERNAL_COMMAND_UNDEF);
        }
    }

    /**
     * Internal
     * Stop an external command
     */
    stopExternal() {
        if (this.childProcess) {
            this.childProcess.kill();
        } else {
            Logger.err("Empty process for service " + this.name);
        }
    }

    /**
     * Stop the service
     */
    stop() {
        if (this.mode === SERVICE_MODE_EXTERNAL) {
            this.stopExternal();
        } else if (this.mode === SERVICE_MODE_THREADED) {
            this.stopThreaded();
        }
        Logger.verbose("Service " + this.name + " stopped");
        this.status = STOPPED;
    }

    /**
     * Restart the service
     */
    restart() {
        this.stop();
        this.start();
    }

    /**
     * Return the service status
     *
     * @returns {int} STOPPED or RUNNING
     */
    status() {
        return this.status;
    }

    /**
     * Register service callback
     *
     * @param  {Object} delegate The service delegate
     */
    register(delegate) {
        let i = this.delegates.indexOf(delegate);
        if (i === -1) {
            this.delegates.push(delegate);
        } else {
            Logger.warn("Delegate already registered");
        }
    }

    /**
     * Unregister service callback
     *
     * @param  {Object} delegate The service delegate
     */
    unregister(delegate) {
        let i = this.delegates.indexOf(delegate);
        if (i > -1) {
            this.delegates.splice(i, 1);
        }
    }
}

module.exports = {class:Service, STOPPED:STOPPED, RUNNING:RUNNING,
    SERVICE_MODE_CLASSIC:SERVICE_MODE_CLASSIC, SERVICE_MODE_THREADED:SERVICE_MODE_THREADED, SERVICE_MODE_EXTERNAL:SERVICE_MODE_EXTERNAL,
    ERROR_EXTERNAL_COMMAND_UNDEF:ERROR_EXTERNAL_COMMAND_UNDEF,
    ERROR_UNDEFINED_THREADS_MANAGER:ERROR_UNDEFINED_THREADS_MANAGER
};
