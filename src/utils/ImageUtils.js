"use strict";
const gm = require("gm");
const fs = require("fs-extra");
const crypto = require("crypto");

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
        const regex = /(.*)base64,(.*)/g;
        const r = regex.exec(fieldData);
        if (r.length >= 3) {
            return r[2];
        }

        return null;
    }

    /**
    * Resize an image and convert to png
    *
    * @param  {string}   b64string  The base64 image string
    * @param  {Function} cb         A callback when image process is done `(err, data) => {}`
    * @param  {number}   [size=100] The size in pixel
    * @returns {string}              The base64 output image string
    */
    static resize(b64string, cb, size = 100) {
        const buf = Buffer.alloc(b64string.length, b64string, "base64");
        gm(buf)
            .resize(size, size)
            .setFormat("png")
            .toBuffer(function (err, buffer) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, buffer.toString("base64"));
                }
            });
    }

    /**
    * Blur, resize an image and convert to png
    *
    * @param  {string}   b64string  The base64 image string
    * @param  {Function} cb         A callback when image process is done `(err, data) => {}`
    * @param  {number}   [size=100] The size in pixel
    * @returns {string}              The base64 output image string
    */
    static blur(b64string, cb, size = 100) {
        const buf = Buffer.alloc(b64string.length, b64string, "base64");
        gm(buf)
            .resize(size, size)
            .blur(10,5)
            .out("-matte")
            .out("-operator", "Opacity", "Assign", "70%")
            .out("-flatten")
            .out("-background", "#FFFFFF")
            .setFormat("png")
            .toBuffer(function (err, buffer) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, buffer.toString("base64"));
                }
            });
    }

    /**
    * Rotate
    *
    * @param  {string}   b64string  The base64 image string
    * @param  {Function} cb         A callback when image process is done `(err, data) => {}`
    * @param  {number}   angle       The rotation in degrees
    * @returns {string}              The base64 output image string
    */
    static rotate(b64string, cb, angle) {
        const buf = Buffer.alloc(b64string.length, b64string, "base64");
        gm(buf)
        .rotate("#FFFFFFFF", angle)
        .setFormat("png")
        .toBuffer((err, buffer) => {
            if (err) {
                cb(err);
            } else {
                cb(null, buffer.toString("base64"));
            }
        });
    }

    /**
    * Paste image in another one
    *
    * @param  {string}   b64string  The base64 image string
    * @param  {Function} cb         A callback when image process is done `(err, data) => {}`
    * @param  {string}   b64stringInput2  The base64 of the second image to merge
    * @param  {string}   tmpFolder  The tmp folder
    * @param  {number}   x  Position X to paste
    * @param  {number}   y  Position X to paste
    * @returns {string}              The base64 output image string
    */
    static merge(b64string, cb, b64stringInput2, tmpFolder, x, y) {
        const buf = Buffer.alloc(b64string.length, b64string, "base64");
        const tmpFile =  tmpFolder + crypto.createHash("md5").update(b64stringInput2, "utf8").digest("hex") + ".png";
        const buf2 = Buffer.alloc(b64stringInput2.length, b64stringInput2, "base64");
        fs.writeFileSync(tmpFile, buf2);
        gm(buf)
        .composite(tmpFile)
        .geometry("+" + x + "+" + y)
        .setFormat("jpg")
        .toBuffer((err, buffer) => {
            if (err) {
                cb(err);
            } else {
                cb(null, buffer.toString("base64"));
            }
        });
    }

    /**
    * Blur, resize an image and convert to png
    *
    * @param  {string}   b64string  The base64 image string
    * @param  {number}   x The position x
    * @param  {number}   y The position y
    * @param  {number}   width The width
    * @param  {number}   height The height
    * @param  {Function} cb         A callback when image process is done `(err, data) => {}`
    * @returns {string}              The base64 output image string
    */
    static crop(b64string, x, y, width, height, cb) {
        const buf = Buffer.alloc(b64string.length, b64string, "base64");
        gm(buf)
            .crop(width, height, x, y)
            .toBuffer(function (err, buffer) {
                if (err) {
                    cb(err);
                } else {
                    cb(null, buffer.toString("base64"));
                }
            });
    }
}

module.exports = {class:ImageUtils};
