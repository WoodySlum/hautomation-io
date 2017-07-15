"use strict";
const TILE_INFO_ONE_TEXT = "InfoOneText"; // One icon, one text, no action
const TILE_INFO_TWO_TEXT = "InfoTwoText"; // One icon, two text, no action
const TILE_INFO_TWO_ICONS = "InfoTwoIcon"; // Two icons, one text, one color, no action
const TILE_ACTION_ONE_ICON = "ActionOneIcon"; // One icon, one action, one color (action auto mapping off)
const TILE_PICTURE_TEXT = "PictureText"; // Background image with a text
const TILE_PICTURES = "PicturesIcon"; // Multiple pictures with an icon
const TILE_GENERIC_ACTION = "GenericAction"; // Extended from ActionOneIcon (action auto mapping on)
const TILE_GENERIC_ACTION_STATUS = "GenericActionWithStatus"; // One icon, one action, one color, and a status (red / green btn)


/**
 * This class describes tiles
 * @class
 */
class Tile {
    /**
     * Constructor
     *
     * @param  {ThemeManager} themeManager              The theme manager
     * @param  {string} identifier                The tile identifier (must be unique)
     * @param  {string} [type=TILE_INFO_ONE_TEXT] The tile's model (or type). Check enum.
     * @param  {string} [icon=null]               The icon
     * @param  {string} [subIcon=null]            The subicon
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
    constructor(themeManager, identifier, type = TILE_INFO_ONE_TEXT, icon = null, subIcon = null, text = null, subText = null, picture = null, pictures = null, status = 0, order = 1, action = null, object = null) {
        this.themeManager = themeManager;
        this.identifier = identifier;
        this.type = type;
        this.icon = icon;
        this.subIcon = subIcon;
        this.text = text;
        this.subText = subText;
        this.picture = picture;
        this.pictures = pictures;
        this.status = status;
        this.order = order;
        this.action = action;
        this.object = object;
        this.colors = {};
        if (this.type === TILE_INFO_ONE_TEXT || this.type === TILE_INFO_TWO_TEXT || this.type === TILE_INFO_TWO_ICONS || this.type === TILE_PICTURES) {
            this.colors.colorDefault = themeManager.getColors().secondaryColor;
            this.colors.colorContent = themeManager.getColors().clearColor;
        } else if (this.type === TILE_ACTION_ONE_ICON || this.type === TILE_GENERIC_ACTION) {
            this.colors.colorDefault = themeManager.getColors().primaryColor;
            this.colors.colorContent = themeManager.getColors().clearColor;
        } else if (this.type === TILE_PICTURE_TEXT) {
            this.colors.colorContent = themeManager.getColors().clearColor;
        } else if (this.type === TILE_GENERIC_ACTION_STATUS) {
            this.colors.colorDefault = themeManager.getColors().primaryColor;
            this.colors.colorContent = themeManager.getColors().clearColor;
            this.colors.colorOn = themeManager.getColors().onColor;
            this.colors.colorOff = themeManager.getColors().offColor;
        }
    }

    /**
     * Get the tile without useless informations
     *
     * @returns {Object} A tile ready to be serialized
     */
    get() {
        const tmpTile = Object.assign({}, this);
        delete tmpTile.themeManager;
        return tmpTile;
    }
}

module.exports = {class:Tile,
    TILE_INFO_ONE_TEXT:TILE_INFO_ONE_TEXT,
    TILE_INFO_TWO_TEXT:TILE_INFO_TWO_TEXT,
    TILE_INFO_TWO_ICONS:TILE_INFO_TWO_ICONS,
    TILE_ACTION_ONE_ICON:TILE_ACTION_ONE_ICON,
    TILE_PICTURE_TEXT:TILE_PICTURE_TEXT,
    TILE_PICTURES:TILE_PICTURES,
    TILE_GENERIC_ACTION:TILE_GENERIC_ACTION,
    TILE_GENERIC_ACTION_STATUS:TILE_GENERIC_ACTION_STATUS
};