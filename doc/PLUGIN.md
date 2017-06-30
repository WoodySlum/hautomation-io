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


### Creating a form and accessing to configuration

You can create a form schema in a specific class. This schema will be automatically managed by the core and user will be able to configure through a form the plugin.

The class must implement :

* An extend of `FormObject` class or a class that extends `FormObject` class
* A json method for serialization
* Annotations (read specific form documentation to get more informations on this)

**Form.js**

	"use strict";

	function loaded(api) {

	    class MyForm extends api.exported.FormObject.class {
			constructor(id, myParameter) {
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
