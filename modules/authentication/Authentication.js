"use strict";
var Logger = require("./../../logger/Logger");
var AuthenticationData = require("./AuthenticationData");
var APIResponse = require("./../../services/webservices/APIResponse");

class Authentication {

    constructor(appConfiguration, webService) {
        Logger.log(appConfiguration);
        webService.register(this);
    }

    processAPI(apiRequest) {
        return new Promise( function(resolve, reject) {
            let authenticationData = new AuthenticationData.class(true, "seb", 1);
            apiRequest.addAuthenticationData(authenticationData);
            //reject(new APIResponse(false, null, 503, "Authentication failed"));
            resolve(new APIResponse.class(true));
         } );
    }
}

module.exports = {class:Authentication};
