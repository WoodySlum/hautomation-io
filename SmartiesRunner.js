var SmartiesCore = require("./src/SmartiesCore");
const events = require("events");

var core = null;
const SmartiesRunnerConstants = require("./SmartiesRunnerConstants");
const os = require("os");
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

        const self = this;
        this.runnerEventBus.on(SmartiesRunnerConstants.RESTART, () => {
            setTimeout((me) => {
                me.restart(me);
            }, RESTART_DELAY * 1000, self);
        });

        this.start(this);
    }

    /**
     * Start core
     *
     * @param  {SmartiesRunner} self The instance
     */
    start(self) {
        if (!self.core) {
            console.log("Starting runner");
            self.core = new SmartiesCore.class(self.runnerEventBus);
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
    console.log("Received SIGINT");
    runner.stop(runner);
    process.kill(process.pid, "SIGKILL");
    process.exit(0);
});

process.on("SIGTERM", () => {
    console.log("Received SIGTERM");
    runner.stop(runner);
    process.kill(process.pid, "SIGKILL");
    process.exit(0);
});
