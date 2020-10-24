var SmartiesCore = require("./src/SmartiesCore");
const events = require("events");

var core = null;
const SmartiesRunnerConstants = require("./SmartiesRunnerConstants");
const Logger = require("./src/logger/Logger");
const os = require("os");
const fs = require("fs-extra");
const childProcess = require("child_process");
const RESTART_DELAY = 5; // In seconds

/**
 * The runner class.
 * @class
 */
class SmartiesRunner {
    /**
     * Constructor
     *
     * @returns {SmartiesRunner} The instance
     */
    constructor() {
        this.core = null;
        this.runnerEventBus = new events.EventEmitter();
        this.childPids = [];

        const self = this;
        this.runnerEventBus.on(SmartiesRunnerConstants.RESTART, () => {
            setTimeout((me) => {
                me.restart(me);
            }, RESTART_DELAY * 1000, self);
        });

        try {
            this.start(this);
        } catch (e) {
            Logger.err(e);
            fs.writeFileSync(SmartiesRunnerConstants.CRASH_FILE, JSON.stringify({message:e.message, stack:e.stack}));
            self.childPids.forEach((childPid) => {
                process.kill(childPid, "SIGTERM");
            });
            this.stop(this);
            process.exit(1);
        }
    }

    /**
     * Start core
     *
     * @param  {SmartiesRunner} self The instance
     */
    start(self) {
        if (!self.core) {
            this.runnerEventBus.on(SmartiesRunnerConstants.PID_SPAWN, (pid) => {
                self.childPids.push(pid);
            });
            Logger.log("Starting runner");
            self.core = new SmartiesCore.class(self.runnerEventBus, SmartiesRunnerConstants);
            self.core.start();
        }
    }

    /**
     * Stop core
     *
     * @param  {SmartiesRunner} self The instance
     */
    stop(self) {
        if (self.core) {
            Logger.log("Sopping runner");
            self.core.stop();
            self.runnerEventBus.eventNames().forEach((eventName) => {
                if (eventName !== SmartiesRunnerConstants.RESTART) {
                    self.runnerEventBus.removeAllListeners(eventName);
                }
            });

            self.core = null;
        }
    }

    /**
     * Restart core
     *
     * @param  {SmartiesRunner} self The instance
     */
    restart(self) {
        self.stop(self);
        self.start(self);
    }
}

const runner = new SmartiesRunner();

process.on("SIGINT", () => {
    Logger.log("Received SIGINT");
    runner.stop(runner);
    process.kill(process.pid, "SIGKILL");
    process.exit(0);
});

process.on("SIGTERM", () => {
    Logger.log("Received SIGTERM");
    runner.stop(runner);
    process.kill(process.pid, "SIGKILL");
    process.exit(0);
});
