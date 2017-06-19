/* eslint-disable */
"use strict";

const dbSchema = {"radio":[
        {"module" : {"type" : "string", "version" : "0.0.0"}},
        {"status" : {"type" : "int", "version" : "0.0.0"}}
    ]
};

function loaded(api) {
    class DbRadio extends api.exported.DbObject.class {

    }

    /**
     * This class shoud be extended by radio modules
     * @class
     */
    class Radio {
        constructor(api) {
            this.api = api;
            this.module = api.identifier;
            this.api.databaseAPI.schema(dbSchema);

            let dbHelper = this.api.databaseAPI.dbHelper("radio", DbRadio);
            //let r = new DbRadio(dbHelper, "rflink", 1);
            dbHelper.getLastObject((err, obj) => {
                //console.log(obj);
            });
        }


    }

    api.exportClass(Radio);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "radio",
    version: "0.0.0",
    category: "radio",
    description: "Parent class for radio devices",
    dependencies:[],
    classes:[]
};
