"use strict";
var Logger = require("./../../logger/Logger");
const threads = require("threads");
const isRunning = require("is-running");
const ERROR_UNKNOWN_IDENTIFIER = "Unknown thread identifier";
const ERROR_STRINGIFY_FUNCTION_THREAD = "Error in thread stringify function";

/**
 * This class allows to manage threads
 * @class
 */
class ThreadsManager {
    /**
     * Constructor
     *
     * @returns {ThreadsManager} The thread manager
     */
    constructor() {
        this.threads = {};
    }

    /**
     * Stringify a function.
     * Convert a class method to standard method definition, for example
     * `myFunction(a, b) {}` to `(a,b)=>{}`
     * Further detaisl : https://github.com/andywer/threads.js/issues/57
     * This method can throw an error if the regex fails
     *
     * @param  {Function} func A class method or classic function
     * @returns {string}      The normalized function as string, needed to be eval
     */
    stringifyFunc(func) {
        const regex = /(\()(.*)(\))([^]{0,1})({)([^]+)(\})/mg;
        let regexResults = regex.exec(func.toString());
        if (regexResults.length === 8) {
            const prototype = "(" + regexResults[2] + ") => {" + regexResults[6] + " return this;}";
            return prototype;
        } else {
            throw Error(ERROR_STRINGIFY_FUNCTION_THREAD);
        }
    }

    /**
     * Run a function or class method in a separated thread
     * Each code contains in the function is sanboxed and should communicate through data and/or callback API
     * All class methods / data can not be accessed
     * Can throw an error
     *
     * @param  {Function} func            A class method, or classic function. Prototype example : `run(data, message) {}`
     * @param  {string} identifier      The thread identifier
     * @param  {Object} [data={}]       Object passed to the threaded code
     * @param  {Function} [callback=null] The callback when a message is received from the thread. Prototype example : `(tData) => {}`
     */
    run(func, identifier, data = {}, callback = null) {
        const prototype = this.stringifyFunc(func);
        const thread  = threads.spawn((input, done, progress) => {
            const Logger = require(input.dirname + "/../../logger/Logger", "may-exclude");

            let f = eval(input.prototype);
            let instance = f(input.data, progress);

            this.process.on("message", (d) => {
                if (d && d.event) {
                    if (typeof instance[d.event] === "function") {
                        instance[d.event](d.data);
                    } else {
                        Logger.err("Thread '" + input.identifier + "' has invalid or unimplemented function type for event '" + d.event + "'");
                    }
                }
            });

            this.process.on("uncaughtException", (err) => {
                process.exit(1);
            });

            done(input.identifier);
        })
        .send({dirname: __dirname, identifier:identifier, prototype:prototype, data:data})
        .on("progress", function message(tData) {
            if (callback) {
                callback(tData);
            }
        })
        .on("error", function(error) {
            Logger.err("Error in thread");
            Logger.err(error.message);
        })
        .on("done", () => {

        });

        this.threads[identifier] = thread;
    }

    /**
     * Send data to thread. In the thread method, the `event` should be impelemented as :
     *     myFunction(data, message) {
     *         this.myEvent = (data) {
     *
     *         }
     *     }
     * Then call function :
     * `threadManager.send("identifier", "myEvent", {value:"foo"})`
     * Can throw error if thread does not exists
     *
     * @param  {string} identifier  The thread identifier
     * @param  {string} event       The event's name
     * @param  {Object} [data=null] Any data passed to thread
     */
    send(identifier, event, data = null) {
        if (this.threads[identifier] && this.isRunning(identifier)) {
            this.threads[identifier].slave.send({event:event, data:data});
        } else {
            throw Error(ERROR_UNKNOWN_IDENTIFIER);
        }
    }

    /**
     * Kill the thread
     * Throw a ERROR_UNKNOWN_IDENTIFIER error if the identifier is unknown
     *
     * @param  {string} identifier Thread identifier
     */
    kill(identifier) {
        if (this.threads[identifier] && this.isRunning(identifier)) {
            this.threads[identifier].kill();
            delete this.threads[identifier];
            Logger.info("Thread " + identifier + " has been terminated");
        } else {
            throw Error(ERROR_UNKNOWN_IDENTIFIER);
        }
    }

    /**
     * Returns the pid of the thread
     *
     * @param  {string} identifier Thread identifier
     * @returns {int}            The pid, if not found send back null
     */
    getPid(identifier) {
        if (this.threads[identifier]) {
            return this.threads[identifier].slave.pid;
        } else {
            return null;
        }
    }

    /**
     * Check if the thread is running or not
     *
     * @param  {string} identifier Thread identifier
     * @returns {boolean}            True or false
     */
    isRunning(identifier) {
        const pid = this.getPid(identifier);
        return pid?isRunning(pid):false;
    }
}

module.exports = {class:ThreadsManager,
    ERROR_UNKNOWN_IDENTIFIER:ERROR_UNKNOWN_IDENTIFIER,
    ERROR_STRINGIFY_FUNCTION_THREAD:ERROR_STRINGIFY_FUNCTION_THREAD
};
