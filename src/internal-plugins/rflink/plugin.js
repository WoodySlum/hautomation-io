/* eslint-disable */
"use strict";
const RFLinkServiceClass = require("./service.js");

function loaded(api) {
    api.init();
    
    /**
     * This class is a RFLink plugin
     * @class
     */
    class RFLink extends api.exported.Radio {
        constructor(api) {
            super(api);
            this.api = api;
            const RFLinkService = RFLinkServiceClass(api);
            api.servicesManagerAPI.add(new RFLinkService(this));
        }
    }

    let rfLink = new RFLink(api);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "rflink",
    version: "0.0.0",
    category: "radio",
    description: "Manage RFLink devices",
    dependencies:["radio"],
    classes:[]
};
