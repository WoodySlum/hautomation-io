/* eslint-disable */
"use strict";

function loaded(api) {
    /**
     * This class shoud be extended by radio modules
     * @class
     */
    class Radio {
        constructor(api) {
            this.api = api;
            this.module = api.identifier;
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
