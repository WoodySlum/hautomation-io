"use strict";
const gm = require("gm");

/**
 * Utility class for images
 * @class
 */
class ImageUtils {
    /**
     * Convert form data to base 64 image
     *
     * @param  {string} fieldData Field data
     * @returns {string}           Base64 image
     */
    static sanitizeFormConfiguration(fieldData) {
        if (fieldData) {
            const regex = /(.*)base64,(.*)/g;
            const r = regex.exec(fieldData);
            if (r.length >= 3) {
                return r[2];
            }
        }

        return null;
    }

    /**
     * Resize an image and convert to png
     *
     * @param  {string}   b64string  The base64 image string
     * @param  {Function} cb         A callback when image process is done `(err, data) => {}``
     * @param  {number}   [size=100] The size in pixel
     * @returns {string}              The base64 output image string
     */
    static resize(b64string, cb, size = 100) {
        if (b64string) {
            const buf = Buffer.from(b64string, "base64");
            gm(buf)
            .resize(size + "x" + size)
            .setFormat("png")
            .toBuffer(function (err, buffer) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, buffer.toString("base64"));
                }
            });
        } else {
            cb(Error("No image"));
        }
    }

    /**
     * Blur, resize an image and convert to png
     *
     * @param  {string}   b64string  The base64 image string
     * @param  {Function} cb         A callback when image process is done `(err, data) => {}``
     * @param  {number}   [size=100] The size in pixel
     * @returns {string}              The base64 output image string
     */
    static blur(b64string, cb, size = 100) {
        if (b64string) {
            const buf = Buffer.from(b64string, "base64");
            gm(buf)
            .resize(size + "x" + size)
            .blur(10,5)
            .out("-matte")
            .out("-operator", "Opacity", "Assign", "40%")
            .out("-flatten")
            .out("-background", "#FFFFFF")
            .blur(100,50)
            .setFormat("png")
            .toBuffer(function (err, buffer) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, buffer.toString("base64"));
                }
            });
        } else {
            cb(Error("No image"));
        }
    }
}

module.exports = {class:ImageUtils};
