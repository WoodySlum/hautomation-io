/* eslint-disable */
"use strict";


function loaded(api) {

    class RFLinkService extends api.exported.Service {
        constructor() {
            super("rflink");
        }
    }

    api.servicesManagerAPI.add(new RFLinkService());

    /**
     * This class is a RFLink plugin
     * @class
     */
    class RFLink {
        constructor(api) {
            this.api = api;

        }
    }

    let rfLink = new RFLink(api);
    //let a = new api.classes[0](api);
    //a.test();
}



module.exports.attributes = {
    loadedCallback: loaded,
    name: "rflink",
    version: "0.0.0",
    category: "radio",
    description: "Manage RFLink devices",
    dependencies:[]
};
