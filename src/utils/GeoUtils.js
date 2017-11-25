"use strict";

/**
 * Utility class for coordinates manipulation
 * @class
 */
class GeoUtils {
    /**
     * Check if coordinates is contained by others coordinates
     *
     * @param  {number}  longitudeA The longitude's zone
     * @param  {number}  latitudeA The latitude's zone
     * @param  {number}  radius     The radius in meters
     * @param  {number}  longitudeB The longitude coordinate to check
     * @param  {number}  latitudeB  The latitude coordinate to check
     * @returns {boolean}            True if coordinates B is in zone, false otherwise
     */
    static isInZone(longitudeA, latitudeA, radius, longitudeB, latitudeB) {
        const distance = this.getDistance(longitudeA, latitudeA, longitudeB, latitudeB);
        return distance>radius?false:true;
    }

    /**
     * Convert degrees to radian
     *
     * @param  {number} angle An degree angle
     * @returns {number}       A radian angle
     */
    static deg2rad(angle) {
        return angle * 0.017453292519943295; // (angle / 180) * Math.PI;
    }

    /**
     * Get the distance in meters of 2 coordinates
     *
     * @param  {number}  longitudeA The first longitude
     * @param  {number}  latitudeA The first latitude
     * @param  {number}  longitudeB The second longitude
     * @param  {number}  latitudeB The second latitude
     * @returns {number}            The distance between coordinates in meter
     */
    static getDistance(longitudeA, latitudeA, longitudeB, latitudeB) {
        const earthRadius = 6371;
        const dLat = this.deg2rad(latitudeB - latitudeA);
        const dLon = this.deg2rad(longitudeB - longitudeA);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(this.deg2rad(latitudeA)) * Math.cos(this.deg2rad(latitudeB)) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.asin(Math.sqrt(a));
        const d = earthRadius * c;

        return Math.round(d * 1000);
    }
}

module.exports = {class:GeoUtils};
