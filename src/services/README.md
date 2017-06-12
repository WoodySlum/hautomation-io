# Services

## Description

This class is designed to be extended, and provides helpers on services.

3 differents services mode can be done

## Generic service

This mode will run on the same thread, you can do this way only if you manage correctly yourself threads, for example a web server.

Here is a generic service sample :

    class MyService extends Service.class {
        constructor() {
            super("my-service-identifier");
        }

        start() {
            super.start();
            this.doSomething();
        }

        start() {
            this.stopDoingSomething();
            super.stop();
        }

        doSomething() {
            // Do stuff
        }

        stopDoingSomething() {
            // Disable stuff
        }
    }

## Threaded service

This mode will run a js code on another process. Everything is done automatically and an IPC mechanism is provided to manage bi-directional informations between main process and sub process.
A `ThreadManager` object should be set in constructor.

The `run(data, send)` method will automatically run in another thread.
You can call `this.send` on another methods than inside `run` function to send an object to sub process.
In the `run(data, send)` you can call `send` to send data to the main process.
All data coming out from the subprocess can be retrieved when overloading the `threadCallback(data)` method.

Remember that all `require` implemented inside `run` function should be relative to the `ThreadsManager` path.

Here is a threaded service sample :

    class MyService extends Service.class {
        constructor(threadsManager) {
            super("my-service-identifier", threadsManager, Service.SERVICE_MODE_THREADED);
        }

        start() {
            super.start();
            setTimeout(() => {
                this.send("foo");
            }, 3000);
        }

        run(data, send) {
            this.test = (data) => {
                console.log("Received " + data + " from main process");
            }
            send("bar");
        }


        threadCallback(data) {
            console.log("Received " + data + " from sub process");
        }
    }

## External service

This mode allows to run an external command as service. The service will manage the PID for you.

Here is a external service sample :

    class MyService extends Service.class {
        constructor() {
            super("my-service-identifier", null, Service.SERVICE_MODE_EXTERNAL, "php -r 'while(1==1){}'");
        }
    }
