// Based on https://github.com/boonepeter/node-mjpeg-proxy
"use strict";

var url = require("url");
var http = require("http");
var https = require("https");

const JPG_HEADER = "FFD8";
const JPG_FOOTER = "FFD9";
const MJPEG_TIMEOUT_MS = 5000;
const ERROR_CLOSE = "CLOSE";
const ERROR_END = "END";
const ERROR_ABORT = "ABORT";
const ERROR_TIMEOUT = "TIMEOUT";

/**
 * This class allows to proxyfy mjpeg streams
 * @class
 */
class MjpegProxy {
    /**
     * Constructor
     *
     * @param  {string} mjpegUrl A mjpeg URL
     * @param  {boolean} [transform=false]    Transform image. `true` will stream thr result of `cb`
     * @param  {Function} [cb=null]    A callback `(err, jpg) => {}`
     * @returns {MjpegProxy}                       The instance
     */
    constructor(mjpegUrl, transform = false, cb = null) {

        this.buffer = null;
        this.cb = cb;
        this.running = true;
        this.mjpegOptions = url.parse(mjpegUrl);
        this.rBuffer = new Buffer(0);
        this.transform = transform;

        this.audienceResponses = [];
        this.newAudienceResponses = [];

        this.boundary = null;
        this.globalMjpegResponse = null;
        const self = this;
        if (mjpegUrl.indexOf("https") != -1) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
        }
        this.mjpegRequest = (mjpegUrl.indexOf("https") == -1 ? http : https).request(self.mjpegOptions, (mjpegResponse) => {
            self.globalMjpegResponse = mjpegResponse;
            self.boundary = self.extractBoundary(mjpegResponse.headers["content-type"]);

            let lastByte1 = null;
            let lastByte2 = null;

            mjpegResponse.on("data", (chunk) => {
                // Fix CRLF issue on iOS 6+: boundary should be preceded by CRLF.
                let buff = Buffer.from(chunk);
                if (lastByte1 != null && lastByte2 != null) {
                    let oldHeader = "--" + self.boundary;

                    let p = buff.indexOf(oldHeader);

                    if (p == 0 && !(lastByte2 == 0x0d && lastByte1 == 0x0a) || p > 1 && !(chunk[p - 2] == 0x0d && chunk[p - 1] == 0x0a)) {
                        const b1 = chunk.slice(0, p);
                        const b2 = new Buffer("\r\n--" + self.boundary);
                        const b3 = chunk.slice(p + oldHeader.length);
                        chunk = Buffer.concat([b1, b2, b3]);
                    }
                }

                lastByte1 = chunk[chunk.length - 1];
                lastByte2 = chunk[chunk.length - 2];

                const p = buff.indexOf("--" + self.boundary);
                if (p >= 0) {
                    if (self.buffer != null) {
                        self.buffer = Buffer.concat([self.buffer, chunk.slice(0, p)]);
                    }

                    if (self.cb && self.buffer) {
                        // Check if corrupted image
                        if (self.buffer.indexOf(JPG_HEADER, 0, "hex") != -1 && self.buffer.indexOf(JPG_FOOTER, 0, "hex") != -1) {

                            let tmpBuffer = self.buffer.slice(self.buffer.indexOf(JPG_HEADER, 0, "hex"), self.buffer.indexOf(JPG_FOOTER, 0, "hex")); // slice for a copy of buffer

                            setTimeout(() => { // Async processing
                                let image = tmpBuffer;
                                if (self.cb) {
                                    image = self.cb(null, tmpBuffer);
                                }
                                // Got a buffer
                                if (self.transform) {// && self.rBuffer && self.rBuffer.length > 0) {
                                    if (self.rBuffer.indexOf(self.boundary) == -1) {
                                        self.rBuffer = Buffer.concat([self.rBuffer, self.generateHeader(image), image]);
                                    } else {
                                        // If there is already a boundary inside, the buffer is already full.
                                        self.rBuffer = Buffer.concat([self.rBuffer.slice(0, self.rBuffer.indexOf(self.boundary)) ,self.generateHeader(image), image]);
                                    }
                                }
                                tmpBuffer = null;
                            }, 0);
                        }
                    }

                    const extr = chunk.slice(p);
                    const startImage = extr.indexOf(JPG_HEADER, 0, "hex");
                    self.buffer = null;
                    self.buffer = Buffer.from(extr.slice(startImage));
                    // console.log("==> " + self.buffer.toString("hex"));
                } else if (self.buffer != null) {
                    self.buffer = Buffer.concat([self.buffer, chunk]);
                }

                for (let i = self.audienceResponses.length; i--;) {
                    const res = self.audienceResponses[i];

                    // First time we push data... lets start at a boundary
                    if (self.newAudienceResponses.indexOf(res) >= 0) {

                        if (p >= 0) {
                            if (!self.transform) {
                                res.write(chunk.slice(p));
                            }
                            self.newAudienceResponses.splice(self.newAudienceResponses.indexOf(res), 1); // remove from new
                        }
                    } else {
                        if (self.transform && self.rBuffer) {
                            res.write(self.rBuffer.slice(0, chunk.length));
                        } else {
                            res.write(chunk);
                        }
                    }
                }

                self.rBuffer = self.rBuffer.slice(chunk.length, self.rBuffer.length);
            });

            mjpegResponse.on("end", () => {
                // console.log("...end");
                for (let i = self.audienceResponses.length; i--;) {
                    const res = self.audienceResponses[i];
                    res.end();
                }
            });

            mjpegResponse.on("close", () => {
                // console.log("...close");
            });
        });

        this.mjpegRequest.setTimeout(MJPEG_TIMEOUT_MS);

        this.mjpegRequest.on("close", () => {
            if (self.cb && self.running) {
                self.running = false;
                self.cb(ERROR_CLOSE);
            }
        });

        this.mjpegRequest.on("end", () => {
            if (self.cb && self.running) {
                self.running = false;
                self.cb(ERROR_END);
            }
        });

        this.mjpegRequest.on("abort", () => {
            if (self.cb && self.running) {
                self.running = false;
                self.cb(ERROR_ABORT);
            }
        });

        this.mjpegRequest.on("timeout", () => {
            if (self.cb && self.running) {
                self.running = false;
                self.cb(ERROR_TIMEOUT);
            }
        });

        this.mjpegRequest.on("error", (e) => {
            if (self.cb && self.running) {
                self.running = false;
                self.cb(e);
            }
        });

        this.mjpegRequest.end();
    }

    /**
     * Generates MJPEG header boundary
     *
     * @param  {Buffer} buffer A buffer full JPG image
     *
     * @returns {Buffer}    The header
     */
    generateHeader(buffer) {
        return Buffer.from("--" + this.boundary + "\r\nContent-type: image/jpeg\r\nContent-Length: " + buffer.length + "\r\n\r\n");
    }

    /**
     * Proxify request
     *
     * @param  {Request} req A request
     * @param  {Response} res    A response
     */
    proxyRequest(req, res) {
        if (res.socket == null) {
            return;
        }

        // There is already another client consuming the MJPEG response
        if (this.mjpegRequest !== null) {
            res.writeHead(200, {
                "Expires": "Mon, 01 Jul 1980 00:00:00 GMT",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Content-Type": "multipart/x-mixed-replace;boundary=" + this.boundary
            });

            this.audienceResponses.push(res);
            this.newAudienceResponses.push(res);

            res.socket.on("close", () => {
                // console.log('exiting client!');

                this.audienceResponses.splice(this.audienceResponses.indexOf(res), 1);
                if (this.newAudienceResponses.indexOf(res) >= 0) {
                    this.newAudienceResponses.splice(this.newAudienceResponses.indexOf(res), 1); // remove from new
                }

                // if (this.audienceResponses.length == 0) {
                //
                // }
            });
        }
    }

    /**
     * Disconnect stream
     */
    disconnect() {
        this.running = false;
        if (this.mjpegRequest) {
            this.mjpegRequest.abort();
            this.mjpegRequest = null;
            this.cb = null;
            // this.globalMjpegResponse.destroy();
        }
    }

    /**
     * Extract mjpeg boundary
     *
     * @param  {string} contentType A content type
     *
     * @returns {string}    The boundary
     */
    extractBoundary(contentType) {
        contentType = contentType.replace(/\s+/g, "");

        let startIndex = contentType.indexOf("boundary=");
        let endIndex = contentType.indexOf(";", startIndex);
        if (endIndex == -1) { //boundary is the last option
            // some servers, like mjpeg-streamer puts a '\r' character at the end of each line.
            if ((endIndex = contentType.indexOf("\r", startIndex)) == -1) {
                endIndex = contentType.length;
            }
        }
        return contentType.substring(startIndex + 9, endIndex).replace(/"/gi,"").replace(/^--/gi, "");
    }
}

module.exports = {class:MjpegProxy, ERROR_CLOSE:ERROR_CLOSE, ERROR_END:ERROR_END, ERROR_ABORT:ERROR_ABORT, ERROR_TIMEOUT:ERROR_TIMEOUT};
