
var HautomationCore = require("./src/HautomationCore");

var core = new HautomationCore.class();
core.start();

process.on("SIGINT", function () {
    console.log("Received SIGINT");
    core.stop();
    process.exit(0);
});

process.on("SIGTERM", function () {
    console.log("Received SIGTERM");
    core.stop();
    process.exit(0);
});
