"use strict";
const PrivateProperties = require("./../PrivateProperties");
const Tile = require("./../../dashboardmanager/Tile");
var Cleaner = require("./../../../utils/Cleaner");

/**
 * Public API for dashboard
 * @class
 */
class DashboardAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {DashboardManager} dashboardManager The dashboard manager
    //  * @returns {DashboardAPI}             The instance
    //  */
    constructor(dashboardManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).dashboardManager = dashboardManager;
    }
    /* eslint-enable */

    /**
     * Register a tile
     *
     * @param  {Tile} tile A tile object
     */
    registerTile(tile) {
        PrivateProperties.oprivate(this).dashboardManager.registerTile(tile);
    }

    /**
     * Unregister a tile
     *
     * @param  {string} tile A tile identifier
     */
    unregisterTile(identifier) {
        PrivateProperties.oprivate(this).dashboardManager.unregisterTile(identifier);
    }

    /**
     * Constructor
     *
     * @param  {string} identifier                The tile identifier (must be unique)
     * @param  {string} [type=TILE_INFO_ONE_TEXT] The tile's model (or type). Models cosntants can be retrieved through `TileType()`
     * @param  {number} [icon=null]               The icon. Use `api.exported.Icons.class.list()` to retrieve icon list.
     * @param  {number} [subIcon=null]            The subicon. Use `api.exported.Icons.class.list()` to retrieve icon list.
     * @param  {string} [text=null]               The text
     * @param  {string} [subText=null]            The sub text
     * @param  {string} [picture=null]            A picture in base64 format
     * @param  {Array} [pictures=null]            A list of Base64 pictures
     * @param  {number} [status=0]                A status (0, 1, ...)
     * @param  {number} [order=1]                 A number that represents the place of the tile. 1 is on top, 999999 is on bottom :)
     * @param  {string} [action=null]             The action (route endpoint without `:`)
     * @param  {Object} [object=null]             An object
     * @returns {Tile}                             A tile
     */
    Tile(identifier, type = Tile.TILE_INFO_ONE_TEXT, icon = null, subIcon = null, text = null, subText = null, picture = null, pictures = null, status = 0, order = 1, action = null, object = null) {
        return new Tile.class(PrivateProperties.oprivate(this).dashboardManager.themeManager, identifier, type, icon, subIcon, text, subText, picture, pictures, status, order, action, object);
    }

    /**
     * Expose a list of tile's type : `TILE_INFO_ONE_TEXT`, `TILE_INFO_TWO_TEXT`, `TILE_INFO_TWO_ICONS`, `TILE_ACTION_ONE_ICON`, `TILE_PICTURE_TEXT`, `TILE_PICTURES`, `TILE_GENERIC_ACTION` or `TILE_GENERIC_ACTION_STATUS`
     *
     * @returns {Object} Constants
     */
    TileType() {
        return Cleaner.class.exportConstants(Tile);
    }
}

module.exports = {class:DashboardAPI};
