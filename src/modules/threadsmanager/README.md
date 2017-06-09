# Threads Manager

## Description

This class allows a part of code running in a sandboxed module, on a separated process. This is secure and provides powerful APIs to transit data between main process and child process.

Process will be kept alive until main process is killed or `kill` function is called.

## API

### Running and communicating with function in separated process

#### run

Run a code in a separated process.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| func  | Function | The function to run in a sandbox |
| identifier  | string | The thread identifier |
| data  | Object | Initial data passed to function when called |
| callback  | Function | The function which receives data from process |


Example :

	class Foo {
        constructor(threadsManager) {
            this.threadsManager = threadsManager;

            this.threadsManager.run(this.sandboxedFunction, "foobar", {}, this.sandboxedFunctionCallback);
        }

        sandboxedFunction(data, message) {
            message("Hello from process !");
        }

        sandboxedFunctionCallback(data) {
            console.log(data);
        }
    }

#### send (complete example)

Send data to process.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| identifier  | string | The thread identifier |
| event  | string | The event |
| data  | Object | Data sent to process |


Example :

    class Foo {
        constructor(threadsManager) {
            this.threadsManager = threadsManager;

            this.threadsManager.run(this.sandboxedFunction, "foobar", {}, this.sandboxedFunctionCallback);
            this.threadsManager.send("foobar", "anEvent", {foo:"bar"});
        }

        sandboxedFunction(data, message) {
            message("Hello from process !");

            this.anEvent = (data) => {
                console.log("Main process sent " + data.foo);
            }
        }

        sandboxedFunctionCallback(data) {
            console.log(data);
        }
    }



#### kill

Kill a process.

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| identifier  | string | The thread identifier |


Example :

    class Foo {
        constructor(threadsManager) {
            this.threadsManager = threadsManager;

            this.threadsManager.run(this.sandboxedFunction, "foobar", {}, this.sandboxedFunctionCallback);
            this.threadsManager.send("foobar", "anEvent", {foo:"bar"});
            try {
                this.threadsManager.kill("foobar");
            } catch(e) {
                console.log("Not running");
            }
        }

        sandboxedFunction(data, message) {
            message("Hello from process !");

            this.anEvent = (data) => {
                console.log("Main process sent " + data.foo);
            }
        }

        sandboxedFunctionCallback(data) {
            console.log(data);
        }
    }
