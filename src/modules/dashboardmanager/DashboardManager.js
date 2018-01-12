"use strict";
const Logger = require("./../../logger/Logger");
const BreakException = require("./../../utils/BreakException").BreakException;
//const Tile = require("./Tile");
const WebServices = require("./../../services/webservices/WebServices");
const Authentication = require("./../authentication/Authentication");
const APIResponse = require("./../../services/webservices/APIResponse");
const DateUtils = require("./../../utils/DateUtils");

const BASE_ROUTE = ":/dashboard/get/";
const ROUTE = BASE_ROUTE + "[timestamp*]/[all*]/";
const BASE_ROUTE_CUSTOMIZE = ":/dashboard/preferences/set/";
const CONF_KEY = "dashboard-preferences";

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
     * @param  {ConfManager} confManager A configuration manager
     * @returns {DashboardManager}                  The instance
     */
    constructor(themeManager, webServices, translateManager, confManager) {
        this.themeManager = themeManager;
        this.webServices = webServices;
        this.translateManager = translateManager;
        this.confManager = confManager;
        this.webServices.registerAPI(this, WebServices.GET, ROUTE, Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, BASE_ROUTE_CUSTOMIZE, Authentication.AUTH_USAGE_LEVEL);

        try {
            this.dashboardPreferences = this.confManager.loadData(Object, CONF_KEY, true);
        } catch(e) {
            this.dashboardPreferences = {};
        }

        this.lastGenerated = DateUtils.class.timestamp();

        this.tiles = [];
    }

    /**
     * Get readable tiles object (without methods, simple POJO)
     *
     * @returns {[Object]} The readable tiles
     */
    getReadableTiles() {
        const tiles = [];
        this.tiles.forEach((tile) => {
            tiles.push(tile.get());
        });

        return tiles;
    }

    /**
     * Returns a tile for a specific identifier
     *
     * @param  {string} identifier The tile identifier
     * @returns {Tile}            A tile or `null` if no tile found
     */
    getTile(identifier) {
        let foundTile = null;
        try {
            this.tiles.forEach((tile) => {
                if (tile.identifier === identifier) {
                    foundTile = tile;
                    throw BreakException;
                }
            });
        } catch (e) {
            if (e !== BreakException) throw e;
        }

        return foundTile;
    }

    /**
     * Register a tile locally, replace if exists and order array
     *
     * @param  {Tile} tile A tile object
     */
    registerTile(tile) {
        const existingTile = this.getTile(tile.identifier);
        let shouldRegister = true;

        if (existingTile && (existingTile.hash() === tile.hash())) {
            shouldRegister = false;
        }

        if (shouldRegister) {
            this.unregisterTile(tile.identifier);

            // Add tile
            this.tiles.push(tile);

            // Sort
            this.tiles.sort((tile1, tile2) => {
                return tile2.order < tile1.order;
            });

            Logger.verbose("Tile " + tile.identifier + " registered");

            // Save generation date
            this.lastGenerated = DateUtils.class.timestamp();
        } else {
            Logger.verbose("The tile " + tile.identifier + " can not be registered. The hash is strictly equal to existing one");
        }
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
     * Remove tiles depending on user preferences
     *
     * @param  {Array} tiles The tiles
     * @param  {string} username Username
     * @returns {Array}          Tiles
     */
    filterTiles(tiles, username = null) {
        if (this.dashboardPreferences[username] && this.dashboardPreferences[username].excludeTiles) {
            const includeTiles = [];
            tiles.forEach((tile) => {
                if (this.dashboardPreferences[username].excludeTiles.indexOf(tile.identifier) === -1) {
                    includeTiles.push(tile);
                }
            });

            return includeTiles;
        } else {
            return tiles;
        }
    }

    /**
     * Build a dashboard object
     *
     * @param  {string} username Username
     * @param  {boolean} allTiles `true` if ot should return all tiles, `false` otherwise
     * @returns {Object} A dashboard object
     */
    buildDashboard(username, allTiles = true) {
        const tiles = this.getReadableTiles().sort(function(a, b) {
            return parseFloat(a.order) - parseFloat(b.order);
        });
        return {
            timestamp:this.lastGenerated,
            timestampFormatted: DateUtils.class.dateFormatted(this.translateManager.t("datetime.format"), this.lastGenerated),
            excludeTiles:(this.dashboardPreferences[username] && this.dashboardPreferences[username].excludeTiles)?this.dashboardPreferences[username].excludeTiles:[],
            tiles:this.filterTiles(tiles, allTiles?null:username)
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
                        resolve(new APIResponse.class(true, self.buildDashboard(apiRequest.authenticationData.username, apiRequest.data.all?true:false)));
                    }
                } else {
                    resolve(new APIResponse.class(true, self.buildDashboard(apiRequest.authenticationData.username, apiRequest.data.all?true:false)));
                }
            });
        } else if (apiRequest.route === BASE_ROUTE_CUSTOMIZE) {
            return new Promise((resolve) => {
                if (apiRequest.data.excludeTiles) {
                    this.dashboardPreferences[apiRequest.authenticationData.username] = {excludeTiles: apiRequest.data.excludeTiles};
                    // Remove duplicates
                    const excludeTiles = [];
                    apiRequest.data.excludeTiles.forEach((excludeTile) => {
                        if (excludeTiles.indexOf(excludeTile) === -1) {
                            excludeTiles.push(excludeTile);
                        }
                    });
                    this.confManager.saveData(this.dashboardPreferences, CONF_KEY);
                    this.lastGenerated = DateUtils.class.timestamp();
                    resolve(new APIResponse.class(true, {success:true}));
                } else {
                    resolve(new APIResponse.class(false, {success:true}));
                }

            });
        }
    }

}

module.exports = {class:DashboardManager};
