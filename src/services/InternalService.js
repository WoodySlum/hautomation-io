var Service = require("./Service");
var Logger = require("./../logger/Logger");

/* eslint-disable */
class InternalService extends Service.class {
    constructor(threadsManager) {
        super("internal-service", threadsManager, Service.SERVICE_MODE_THREADED, null);
        //super("internal-service", threadsManager, Service.SERVICE_MODE_EXTERNAL, "php -r 'while(1==1){}'");
    }

    start() {
        super.start();
        setTimeout(() => {
            this.send("test");
        }, 3000);
    }

    run(data, send) {
        this.test = (data) => {
            Logger.log("I'm in subprocess");
        }
        send("Coming back from process !");
    }


    threadCallback(data) {
        console.log(data);
    }
}


module.exports = {class:InternalService};
