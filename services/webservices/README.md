# Web Services

## Description

This class allows to create an API endpoint.
Any class can register a specific route and will call back a method when the endpoint is requested.

## API

### Registration

#### register

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| delegate  | Object | Delegate must implement method `processAPI` |

Example :

	let w = new WebServices();
	w.register(this);

#### registerAPI

| Parameter | Type     | Additional informations                                                                                     |
|-----------|----------|-------------------------------------------------------------------------------------------------------------|
| delegate  | Object   | Delegate must implement method `processAPI`                                                                 |
| method    | Constant | Web Services method, commonly WebServices.GET or WebServices.POST. You can use wilcard `*` for all methods. |
| route     | String   |  The route you want to register, for example `:/my/route/`. You can use wilcard `*` for all methods.        |
| authLevel | Int      |  The authentication level needed for the API. `Authentication.AUTH_NO_LEVEL`, `Authentication.AUTH_USAGE_LEVEL` or `Authentication.AUTH_MAX_LEVEL`        |

Example :

	let w = new WebServices();
	w.registerAPI(this, WebServices.POST, ":/foo/bar/");

#### unregister

| Parameter | Type   | Additional informations                     |
|-----------|--------|---------------------------------------------|
| delegate  | Object |  The delegate which implements `processAPI` method |

Example :

	let w = new WebServices();
	w.register(this);
	w.unregister(this);

#### unregisterAPI

| Parameter | Type     | Additional informations                                                                                     |
|-----------|----------|-------------------------------------------------------------------------------------------------------------|
| delegate  | Object   | The delegate which implements `processAPI` method                                                                 |
| method    | Constant | Web Services method, commonly WebServices.GET or WebServices.POST. You can use wilcard `*` for all methods. |
| route     | String   |  The route you want to register, for example `:/my/route/`. You can use wilcard `*` for all methods.        |

Example :

	let w = new WebServices();
	w.registerAPI(this, WebServices.POST, ":/foo/bar/");
	// Unsubscribe for route notification
	w.unregisterAPI(this, WebServices.POST, ":/foo/bar/");

#### Callback

When a delegate is registered, a method in this class should be implemented to receive WebServices events. You need to implement `processAPI` method which return a `Promise`.
The parameter will provide all needed informations for data processing.

Parameter `processAPI` description :

| Parameter          | Type               | Additional informations                                             |
|--------------------|--------------------|---------------------------------------------------------------------|
| method             | Constant           |* For example, `GET` or `POST`                                        |
| ip                 | String             | Requester's IP address                                              |
| route              | String             | The route you want to register, for example `:/my/route/`.          |
| path               | Array              | The route exploded under array, for example `["my","route"]`        |
| action             | String             | First route parameter, for example `my`                             |
| params             | Array              | Array of parameters, GET or POST values                             |
| data               | Object             | Data passed as JSON in body content, if available                   |
| authenticationData | AuthenticationData | The data authentication, with `authorized`, `username`, and `level` |

Code example (success) :

	processAPI(apiRequest) {
        return new Promise((resolve, reject) => {
			// API has been successfully processed by the class, and return a foo bar object
            resolve(new APIResponse.class(true, {"foo":"bar"}));
         } );
    }

Code example (failed) :

	processAPI(apiRequest) {
        return new Promise((resolve, reject) => {
			// API has been badly processed by the class, and return an error with code 400 and message foobar
            reject(new APIResponse.class(false, {}, 400, "foobar"));
         } );
    }


