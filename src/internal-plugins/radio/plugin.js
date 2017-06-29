/* eslint-disable */
"use strict";

const dbSchema = {"radio":[
        {"module" : {"type" : "string", "version" : "0.0.0"}},
        {"status" : {"type" : "int", "version" : "0.0.0"}}
    ]
};

function loaded(api) {
    api.init();

    class DbRadio extends api.exported.DbObject.class {
        constructor(dbHelper = null, ...values) {
            super(dbHelper, ...values);

            /**
             * @Property("module");
             * @Type("string");
             * @Version("0.0.0");
             */
            this.module;

            /**
             * @Property("status");
             * @Type("int");
             * @Version("0.0.0");
             */
            this.status;

        }
    }

    /**
     * This class shoud be extended by radio modules
     * @class
     */
    class Radio {
        constructor(api) {
            this.api = api;
            this.module = api.identifier;
            this.api.databaseAPI.register(DbRadio);

            let dbHelper = this.api.databaseAPI.dbHelper(DbRadio);
            let r = new DbRadio(dbHelper, "rflink", 1);
            //r.save();
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
