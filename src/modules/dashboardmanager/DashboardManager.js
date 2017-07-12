"use strict";
const Logger = require("./../../logger/Logger");
//const Tile = require("./Tile");
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");
const DateUtils = require("./../../utils/DateUtils");

const BASE_ROUTE = ":/dashboard/get/";
const ROUTE = BASE_ROUTE + "[timestamp*]/";

/**
 * This class generates dashboard from tiles
 * @class
 */
class DashboardManager {
    /**
     * Constructor
     *
     * @param  {ThemeManager} themeManager     A theme manager
     * @param  {WebServices} webServices      Web services instance
     * @param  {TranslateManager} translateManager A translate manager
     * @returns {DashboardManager}                  The instance
     */
    constructor(themeManager, webServices, translateManager) {
        this.themeManager = themeManager;
        this.webServices = webServices;
        this.translateManager = translateManager;
        this.webServices.registerAPI(this, WebServices.GET, ROUTE, Authentication.AUTH_NO_LEVEL);
        this.lastGenerated = DateUtils.class.timestamp();

        this.tiles = [];
    }

    /**
     * Register a tile locally, replace if exists and order array
     *
     * @param  {Tile} tile A tile object
     */
    registerTile(tile) {
        this.unregisterTile(tile.identifier);

        // Add tile
        this.tiles.push(tile.get());

        // Sort
        this.tiles.sort((tile1, tile2) => {
            return tile2.order < tile1.order;
        });

        Logger.verbose("Tile " + tile.identifier + " registered");

        // Save generation date
        this.lastGenerated = DateUtils.class.timestamp();
    }

    /**
     * Remove a tile with identifier
     *
     * @param  {string} identifier A tile identifier
     */
    unregisterTile(identifier) {
        const indexes = [];

        // Collect registered indexes
        for (let i = 0 ; i < this.tiles.length ; i++) {
            if (this.tiles[i].identifier === identifier) {
                indexes.push(i);
            }
        }

        // Remove existing tiles
        indexes.forEach((index) => {
            this.tiles.splice(index, 1);
        });

        // Save generation date
        this.lastGenerated = DateUtils.class.timestamp();
    }

    /**
     * Build a dashboard object
     *
     * @returns {Object} A dashboard object
     */
    buildDashboard() {
        return {
            timestamp:this.lastGenerated,
            timestampFormatted: DateUtils.class.dateFormatted(this.translateManager.t("datetime.format"), this.lastGenerated),
            tiles:this.tiles
        };
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        const self = this;
        if (apiRequest.route.startsWith(BASE_ROUTE)) {
            return new Promise((resolve) => {
                if (apiRequest.data.timestamp) {
                    if (parseInt(apiRequest.data.timestamp) >= parseInt(this.lastGenerated)) {
                        // Up to date !
                        resolve(new APIResponse.class(true, {}, null, null, true));
                    } else {
                        resolve(new APIResponse.class(true, self.buildDashboard()));
                    }
                } else {
                    resolve(new APIResponse.class(true, self.buildDashboard()));
                }
            });
        }
    }

}

module.exports = {class:DashboardManager};
