var Service = require("./Service");
var Logger = require("./../logger/Logger");

/* eslint-disable */
class InternalService extends Service.class {
    constructor(threadsManager) {
        super("internal-service", threadsManager, Service.SERVICE_MODE_THREADED, null);
    }

    run(data, message) {
        var http = require('http');
        var counter = 0;

        http.createServer(function (req, res) {

          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end('Hello New York\n');
          console.log("======>" + counter);
          counter ++;
        }).listen(3001);
        console.log('Server running at http://localhost:3001/');

    }


}


module.exports = {class:InternalService};
