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
    }

    /**
     * Start the service
     */
    start() {
        this.status = RUNNING;
        if (this.mode === SERVICE_MODE_EXTERNAL) {
            this.startExternal();
        } else if (this.mode === SERVICE_MODE_THREADED) {
            this.startThreaded();
        }
    }

    run(data, message) {
        //log("HEY");
        message({a:"bbbb"});

        //
        var fs = require("fs");
        var file = "/tmp/titi";
        fs.writeFileSync(file, new Date().getTime());


        // var sleep = require("system-sleep");
        //
        //       let i = 0;
        //       while (true) {
        //           sleep(10);
        //           i++;
        //           if (i > 500) {
        //             console.log("TICK");
        //             i = 0;
        //           }
        //      }

    }

    startThreaded() {
        if (this.threadsManager) {
            this.threadsManager.run(this.run, this.name, {test:"abc"}, (tData) => {
                Logger.warn(tData);
            });
            this.pid = this.threadsManager.getPid(this.name);
            //this.threadsManager.kill(this.name);
            setTimeout(() => {
                //this.threadsManager.send(this.name, "toto");
            }, 10000);
        } else {
            throw Error(ERROR_UNDEFINED_THREADS_MANAGER);
        }
    }

    startExternal() {
        if (this.command) {
            const r = cp.exec(this.command, function callback(error, stdout, stderr){
                if (error) Logger.err(error);
                if (stderr) Logger.err(stderr);
            });
            this.pid = r.pid;
            Logger.info("PID : " + this.pid);
        } else {
            throw Error(ERROR_EXTERNAL_COMMAND_UNDEF);
        }
    }

    /**
     * Stop the service
     */
    stop() {
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
