# Plugins tutorial

## Creating a new plugin

**Note : The plugin can be written in ES6** as the core supports it.

1. Create a `node_modules` if not existing folder where the `hautomation` binary is.
2. The create a `my-plugin` folder.
3. Create a `plugin.js` file into this folder
4. Create a `lng` folder with an `en.json` file inside


Tree structure :

	|
	|-hautomation
	|-node_modules
		|-my-plugin
			|-plugin.js
			|-lng
				|-en.json
				|-fr.json
				|-...



## plugin.js base

Here is a simple plugin template :

	"use strict";

	function loaded(api) {
	    api.init();
		// Plugin code needs to be typed here
	}

	module.exports.attributes = {
	    loadedCallback: loaded,
	    name: "my-plugin",
	    version: "0.0.1",
	    category: "misc",
	    description: "My first hautomation plugin",
		dependencies:[],
	    classes:[]
	};

### Creating and expose to others plugins

You can expose your class to others plugins with the `api.exportClass` method

Example :

	function loaded(api) {
	    api.init();

		class MyClass {
			constructor() {

			}
		}

		// Export class to other plugins
		api.exportClass(MyClass);

	}


### Importing class from others plugin

You can use some other's plugin class easilly using the `api.exported` property.
Consider that `MyClass` has been exported by another plugin, as above.

Example :

	function loaded(api) {
	    api.init();

		class MySuperClass extends api.exported.MyClass {
			constructor() {
				super();
			}
		}
	}


You'll need to notify core that you need dependency for the plugin that export class.

	module.exports.attributes = {
		[...]
	   	dependencies:["my-plugin"],
	    [...]
	};


### Trigger regularly task

You can `cron` some tasks by registering through the `TimeEventAPI`.

To register, use this as follow :

    function repeat(self) {
        console.log("Hello every seconds :)");
    }

    api.timeEventAPI.register(repeat, this, api.timeEventAPI.constants().EVERY_SECONDS);

The `repeat` function will be called every seconds.
You can use the following constants : `EVERY_SECONDS`, `EVERY_MINUTES`, `EVERY_HOURS`, `EVERY_DAYS` or `CUSTOM`

The context (second parameter, `this` in the example above) is used when using a class function. You'll not able to use `this` inside `repeat` function because of changing scope. The context is passed through the callback parameter.

#### Using custom and go further

You can also specify exactly when you want to be called back through the custom option.

    api.timeEventAPI.register(repeat, this, api.timeEventAPI.constants().CUSTOM, "*", 10, 0);

The method will be called every hour, when minutes will be equals to 10 and seconds to 0.

### Schedule an operation

Core gives you the possibility to schedule a single operation in the future. For example, of you want to turn lights after a certain delay, this API is the one.
Operations are resumed if Hautomation restarts.

You need first to register with a unique id the callback :

	function scheduledOperation(data) {
        console.log("My name is " + data.name);
    }

	api.schedulerAPI.register("display-a-name", scheduledOperation);

Then you can schedule your operation :

	api.schedulerAPI.schedule("display-a-name", api.schedulerAPI.constants().IN_A_MINUTE, {name:"Foobar"});

Or at a specific timestamp :

	api.schedulerAPI.schedule("display-a-name", 1499018983, {name:"Foobar"});


### Creating a form and accessing to configuration

You can create a form schema in a specific class. This schema will be automatically managed by the core and user will be able to configure through a form the plugin.

The class must implement :

* An extend of `FormObject` class or an existing class that extends `FormObject` class
* A json method for serialization
* Annotations (read specific form documentation to get more informations on this)

**Form.js**

	"use strict";

	function loaded(api) {

	    class MyForm extends api.exported.FormObject.class {
			constructor(id, myParameter) {
                super(id);
				/**
	             * @Property("myParameter");
	             * @Type("string");
	             * @Title("A parameter sample");
	             */
	        	this.myParameter = myParameter;
			}

			json(data) {
				return new MyForm(data.id, data.myParameter);
			}
		}

		return MyForm;
	}

	module.exports = loaded;


**plugin.js**

	"use strict";
	const MyFormClass = require("./Form.js");

	function loaded(api) {
	    api.init();
		// Register a form
		api.configurationAPI.register(MyFormClass(api));

		// Get the configuration
		const config = api.configurationAPI.getConfiguration();
        if (config) {
            console.log(config.myParameter);
        }
	}

	module.exports.attributes = {
	    loadedCallback: loaded,
	    name: "my-plugin",
	    version: "0.0.1",
	    category: "misc",
	    description: "My first hautomation plugin",
		dependencies:[],
	    classes:[]
	};

### Using database

As forms, you can create a simple database schema using annotations.

1. The schema (or class with annotations) must be registered
2. You need to retrieve the `DbHelper` instance
3. Manage request using `DbRequestBuilder` object

On the annotations, you have to specify on wich version field is introduced. The core will automatically manage databse schema update depending on the versions of your plugin.

**Database.js**

	"use strict";

	function loaded(api) {

	    class MyTable extends api.exported.DbObject.class {
	        constructor(dbHelper = null, ...values) {
	            super(dbHelper, ...values);

	            /**
	             * @Property("text");
	             * @Type("string");
	             * @Version("0.0.0");
	             */
	            this.text;

	            /**
	             * @Property("number");
	             * @Type("int");
	             * @Version("0.0.0");
	             */
	            this.number;
	        }
	    }

		return MyTable;
	}

	module.exports = loaded;


**plugin.js**

	"use strict";
	const MyTableClass = require("./Database.js");

	function loaded(api) {
	    api.init();
		const MyTable = MyTableClass(api);

		// Register a schema
		api.databaseAPI.register(MyTable);

		// Retrieve DbHelper
		const dbHelper = api.databaseAPI.dbHelper(MyTable);

		// Creating an object
		// "A Sample text" will be mapped to text property, 2015 will be mapped to number property
		const dbObject = new MyTable(dbHelper, "A sample text", 2015);

		// Save the object in database
		dbObject.save();

		// Get the last inserted object
		dbHelper.getLastObject((err, obj) => {
        	if (!err) {
				console.log("Last object text : " + obj.text);
				console.log("Last object number : " + obj.number);
			}
        });

	}

	module.exports.attributes = {
	    loadedCallback: loaded,
	    name: "my-plugin",
	    version: "0.0.1",
	    category: "misc",
	    description: "My first hautomation plugin",
		dependencies:[],
	    classes:[]
	};


### Getting icons

The icons can list can be retrieved using :

	api.exported.Icons.class.list()

This well provide an object with Key / Values where values is the icon's code.

### Using date / time formatting

Several common methods ara vailable with the `DateUtils` class :

	api.exported.DateUtils.class.timestamp();

Other methods are available. Check Public APIS documentation.

### Logging

A logger can be used through the `api.exported` property.

Example :

	api.exported.Logger.info("An information");
	api.exported.Logger.warn("A warning");
	api.exported.Logger.err("An error");
	api.exported.Logger.verbose("A verbose message");
	api.exported.Logger.debug("A debug log");

### Create dashboard tiles

You can add easily tiles on dashboard. The `dashboardAPI` property allows to do this.
Two steps are required :

- Create a new tile
- Register the tile

You can use the icon helper (check above) to access icons.
Each tile have a type, which can be acessible through `api.dashboardAPI.TileType()` method. The available tile types are the following : `TILE_INFO_ONE_TEXT`, `TILE_INFO_TWO_TEXT`, `TILE_INFO_TWO_ICONS`, `TILE_ACTION_ONE_ICON`, `TILE_PICTURE_TEXT`, `TILE_PICTURES`, `TILE_GENERIC_ACTION` or `TILE_GENERIC_ACTION_STATUS`


**Keep in mind that you'll need to register tile each time the information is updated**

Example :

	// Register a tile
    const tile = api.dashboardAPI.Tile("test-plugin", api.dashboardAPI.TileType().TILE_INFO_ONE_TEXT, api.exported.Icons.class.list()["map-pin"], null, "A tile title");
    api.dashboardAPI.registerTile(tile);

### Create a sensor

Sensor must have a particular architecture :

    SensorClass <--> Intermediate sensor Layer <--> Sensor plugin

The intermediate layer will define the units, the type and the aggregation rules for the sensor.
If the intermediate layer exists it's easy to create a new sensor.

You need to define a minimum sensor form.

Example :

    "use strict";
    /**
     * Loaded function
     *
     * @param  {PluginAPI} api The api
     */
    function loaded(api) {
        api.init();

        /**
         * Esp temperature form sensor
         * @class
         */
        class EspTemperatureSensorForm extends api.exported.TemperatureSensorForm {
            /**
             * Convert JSON data to object
             *
             * @param  {Object} data Some data
             * @returns {EspTemperatureSensorForm}      An instance
             */
            json(data) {
                super.json(data);
            }
        }

        api.sensorAPI.registerForm(EspTemperatureSensorForm);

        /**
         * This class is overloaded by sensors
         * @class
         */
        class EspTemperatureSensor extends api.exported.TemperatureSensor {
            /**
             * ESP Temperature sensor class (should be extended)
             *
             * @param  {PluginAPI} api                                                           A plugin api
             * @param  {number} [id=null]                                                        An id
             * @param  {Object} [configuration=null]                                             The configuration for sensor
             * @returns {EspTemperatureSensor}                                                       The instance
             */
            constructor(api, id, configuration) {
                super(api, id, configuration);
                this.api.webAPI.register(this, this.api.webAPI.constants().POST, ":/esp/temperature/set/" + this.id + "/[value]/[vcc*]/", this.api.webAPI.Authentication().AUTH_NO_LEVEL);
            }

            /**
             * Process API callback
             *
             * @param  {[type]} apiRequest An APIRequest
             * @returns {Promise}  A promise with an APIResponse object
             */
            processAPI(apiRequest) {
                return new Promise((resolve) => {
                    this.setValue(apiRequest.data.value, apiRequest.data.vcc?parseFloat(apiRequest.data.vcc):null);
                    resolve(this.api.webAPI.APIResponse(true, {success:true}));
                });
            }
        }

        api.sensorAPI.registerClass(EspTemperatureSensor);
    }

    module.exports.attributes = {
        loadedCallback: loaded,
        name: "esp-temperature-sensor",
        version: "0.0.0",
        category: "sensor",
        description: "ESP temperature sensor",
        dependencies:["temperature-sensor"]
    };

Intermediate layer example :

    "use strict";
    /**
     * Loaded function
     *
     * @param  {PluginAPI} api The api
     */
    function loaded(api) {
        api.init();

        /**
         * This class is extended by temperature sensors
         * @class
         */
        class TemperatureSensorForm extends api.exported.SensorForm {
            /**
             * Sensor form
             *
             * @param  {number} id              An identifier
             * @param  {string} plugin          A plugin
             * @param  {string} name            Sensor's name
             * @param  {boolean} dashboard       True if display on dashboard, otherwise false
             * @param  {boolean} statistics      True if display on statistics, otherwise false
             * @param  {string} dashboardColor  The dashboard color
             * @param  {string} statisticsColor The statistics color
             * @param  {string} unit The default unit
             * @returns {SensorForm}                 The instance
             */
            constructor(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor, unit) {
                super(id, plugin, name, dashboard, statistics, dashboardColor, statisticsColor);

                /**
                 * @Property("unit");
                 * @Title("sensor.temperature.unit");
                 * @Enum(["cel", "far"]);
                 * @EnumNames(["Celsius", "Fahrenheit"]);
                 * @Type("string");
                 * @Required(true);
                 */
                this.unit = unit;
            }

            /**
             * Convert JSON data to object
             *
             * @param  {Object} data Some data
             * @returns {TemperatureSensorForm}      An instance
             */
            json(data) {
                return new TemperatureSensorForm(data.id, data.plugin, data.name, data.dashboard, data.statistics, data.dashboardColor, data.statisticsColor, data.unit);
            }
        }

        api.sensorAPI.registerForm(TemperatureSensorForm);

        /**
         * This class is overloaded by sensors
         * @class
         */
        class TemperatureSensor extends api.exported.Sensor {
            /**
             * Temperature sensor class (should be extended)
             *
             * @param  {PluginAPI} api                                                           A plugin api
             * @param  {number} [id=null]                                                        An id
             * @param  {Object} [configuration=null]                                             The configuration for sensor
             * @returns {TemperatureSensor}                                                       The instance
             */
            constructor(api, id, configuration) {
                super(api, id, "TEMPERATURE", configuration, api.exported.Icons.class.list()["uniF2C8"], 1);
                this.setUnit(configuration.unit);
            }

            /**
             * Set the unit depending on configuration
             *
             * @param {string} unit A unit configuration (`deg` or `far`)
             */
            setUnit(unit) {
                this.unit = "°C";
                if (unit === "far") {
                    this.unit = "°F";
                    this.unitConverter = (value) => {
                        return value * (9/5) + 32;
                    };
                }
            }
        }

        api.sensorAPI.registerClass(TemperatureSensor);
    }

    module.exports.attributes = {
        loadedCallback: loaded,
        name: "temperature-sensor",
        version: "0.0.0",
        category: "sensor-base",
        description: "Temperature Sensor base plugin",
        dependencies:["sensor"]
    };

You can add aggregation values to the sensor. For example, if you have 63 minutes, you surely want to get 1 hour instead.
You can use `this.addUnitAggregation(unitName, lowThreshold = 0)` on your plugin to add a unit aggregation.

### Installing external app / dependency

You can execute some command lines when you need for example to install an external application.
The `installerAPI` can be used to do that. All you need is to to register the command. The commands will run only for the current version of the plugin, and only once.
When all commands will be done, the core will restart automatically.

Here is an example :
	
	api.installerAPI.register(["arm"], "sleep 2; echo \"Hello !\"");

### Users

#### Get users

	api.userAPI.getUsers().forEach((user) => {
		console.log(user.username);
	});

#### Add fields on user registration

	class SampleForm extends api.exported.FormObject.class {
        constructor(id, xo) {
            super(id);
            /**
             * @Property("xo");
             * @Type("string");
             * @Title("Another extended form");
             */
            this.xo = xo;
        }

        json(data) {
            return new SampleForm(data.id, data.xo);
        }
    }

	api.userAPI.addAditionalFields(SampleForm);

### Messages

The `messageAPI` can be used to send messages / receive messages.

#### Send a message

	api.messageAPI.sendMessage(["seb"], "Hey !");


#### Receive a message

	"use strict";

	function loaded(api) {
	    api.init();
		
		class Sample() {
			constructor(api) {
				api.messageAPI.register(this);
			}

			onMessageReceived(sender, message) {
				// Do something !
			}

		}

	}


#### Create a new message provider

Here is a plugin sample for new message provider :

	"use strict";
	const Prowler = require("prowler");
	
	/**
	 * Loaded function
	 *
	 * @param  {PluginAPI} api The api
	 */
	function loaded(api) {
	    /**
	     * This class is extended by user form
	     * @class
	     */
	    class ProwlForm extends api.exported.FormObject.class {
	        /**
	         * Prowl user form
	         *
	         * @param  {number} id              An identifier
	         * @param  {string} prowlApiKey     A prowl API key
	         * @returns {SensorForm}                 The instance
	         */
	        constructor(id, prowlApiKey) {
	            super(id);
	
	            /**
	             * @Property("prowlApiKey");
	             * @Title("prowl.api.key.title");
	             * @Type("string");
	             */
	            this.prowlApiKey = prowlApiKey;
	        }
	
	        /**
	         * Convert JSON data to object
	         *
	         * @param  {Object} data Some data
	         * @returns {ProwlForm}      An instance
	         */
	        json(data) {
	            return new ProwlForm(data.id, data.prowlApiKey);
	        }
	    }
	
	    api.userAPI.addAdditionalFields(ProwlForm);
	
	    /**
	     * Prowl plugin class
	     * @class
	     */
	    class Prowl extends api.exported.MessageProvider {
	        /**
	         * Constructor
	         *
	         * @param  {PluginAPI} api The API
	         * @returns {Prowl}     The instance
	         */
	        constructor(api) {
	            super(api);
	            this.api = api;
	        }
	
	        /**
	         * Send a message to all plugins.
	         *
	         * @param  {string|Array} [recipients="*"] The recipients. `*` for all users, otherwise an array of usernames - user `userAPI`, e.g. `["seb", "ema"]`
	         * @param  {string} message          The notification message
	         * @param  {string} [action=null]    The action
	         * @param  {string} [link=null]      The link
	         * @param  {string} [picture=null]   The picture
	         */
	        sendMessage(recipients = "*", message, action = null, link = null, picture = null) {
	            this.api.userAPI.getUsers().forEach((user) => {
	                if (recipients === "*" || (recipients instanceof Array && recipients.indexOf(user.username) !== -1)) {
	                    try {
	                        var notification = new Prowler.connection(user.prowlApiKey);
	                        let actionprefixed = "hautomation://";
	                        if (action) {
	                            actionprefixed += action;
	                        }
	                        notification.send({
	                            "application": 'Hautomation',
	                            "event": message,
	                            "description": ""
	                        });
	                    } catch(e) {
	                        api.exported.Logger.err(e.message);
	                    }
	                }
	            });
	        }
	    }
	
	    api.instance = new Prowl(api);
	}
	
	module.exports.attributes = {
	    loadedCallback: loaded,
	    name: "prowl",
	    version: "0.0.0",
	    category: "message-provider",
	    description: "Prowl message sending",
	    dependencies:["message-provider"]
	};
	

### Scenarios

You can add scenarios addon to your plugin using the `scenarioAPI`. This API is composed of 3 concepts :

* The scenario form registration
	* Refer to form part. You can create subforms.
* The trigger callback
	* Called when an scenario is triggered. If you have specific actions to do, the callback will be executed (turn on / off lights, ...)
* The trigger action
	* Call this method to trigger actions. All callbacks will be executed.

Sample :

    /* eslint-disable */
    "use strict";

    function loaded(api) {
        api.init();

        class ScenarioSampleForm extends api.exported.FormObject.class {
            constructor(id, text) {
                super(id);
                /**
                 * @Property("text");
                 * @Type("string");
                 * @Title("A text field");
                 */
                this.text = text;
            }

            json(data) {
                return new ScenarioSampleForm(data.id, data.text);
            }
        }


        /**
         * This class is a sample plugin
         * @class
         */
        class Sample {
            constructor(api) {
                this.api = api;
                
                // Register scenario and add a text field on scenario form
                this.api.scenarioAPI.register(ScenarioSampleForm, (scenario) => {
                    // Do what you want here
                    this.api.exported.Logger.info(scenario);
                    // If the scenario contains the text "demo" display a simple log line
                    if (scenario.ScenarioSampleForm && scenario.ScenarioSampleForm.text && scenario.ScenarioSampleForm.text === "demo") {
                        this.api.exported.Logger.info("A scenario has been trigggered with the 'demo' text !")
                    }
                }, "a.text.title");

                // Scheduler callback. Will trigger scenario when scheduler timer is reached.
                this.api.schedulerAPI.register("scenario-test", (data) => {
                    this.api.scenarioAPI.getScenarios().forEach((scenario) => {
                        // If the scenario containes the text "demo" trigger the scenario
                        if (scenario.ScenarioSampleForm && scenario.ScenarioSampleForm.text && scenario.ScenarioSampleForm.text === "demo") {
                            this.api.scenarioAPI.triggerScenario(scenario);
                        }
                    });
                });

                // Schedule the trigger scenario in a minute
                this.api.schedulerAPI.schedule("scenario-test", this.api.schedulerAPI.constants().IN_A_MINUTE);
            }
        }

        let s = new Sample(api);

    }

    module.exports.attributes = {
        loadedCallback: loaded,
        name: "sample-plugin",
        version: "0.0.0",
        category: "misc",
        description: "I'm a sample plugin"
    };	
 
