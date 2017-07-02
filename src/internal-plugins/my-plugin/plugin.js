/* eslint-disable */
"use strict";
const MyFormClass = require("./Form.js");
const MyTableClass = require("./Database.js");

function loaded(api) {
    api.init();
    // Register a form
    api.configurationAPI.register(MyFormClass(api));

    // Get the configuration
    const config = api.configurationAPI.getConfiguration();
    if (config) {
        console.log(config.myParameter);
    }

    // Database
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
