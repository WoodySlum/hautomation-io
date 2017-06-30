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


