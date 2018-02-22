"use strict";
const sha256 = require("sha256");
const request = require("request");
const MjpegProxy = require("mjpeg-proxy").MjpegProxy;
const fs = require("fs-extra");
const Logger = require("./../../logger/Logger");
const PluginsManager = require("./../pluginsmanager/PluginsManager");
const WebServices = require("./../../services/webservices/WebServices");
const APIResponse = require("./../../services/webservices/APIResponse");
const Authentication = require("./../authentication/Authentication");
const DateUtils = require("./../../utils/DateUtils");
const CamerasForm = require("./CamerasForm");
const CamerasListForm = require("./CamerasListForm");
const Tile = require("./../dashboardmanager/Tile");
const Icons = require("./../../utils/Icons");
const ImageUtils = require("./../../utils/ImageUtils");
const TimeEventService = require("./../../services/timeeventservice/TimeEventService");
const TimelapseGenerator = require("./TimelapseGenerator");

const CONF_MANAGER_KEY = "cameras";
const CAMERAS_MANAGER_AVAILABLE_GET = ":/cameras/available/get/";
const CAMERAS_MANAGER_POST_BASE = ":/cameras/set";
const CAMERAS_MANAGER_POST = CAMERAS_MANAGER_POST_BASE + "/[id*]/";
const CAMERAS_MANAGER_GET = ":/cameras/get/";
const CAMERAS_MANAGER_DEL_BASE = ":/cameras/del";
const CAMERAS_MANAGER_DEL = CAMERAS_MANAGER_DEL_BASE + "/[id*]/";
const CAMERAS_MANAGER_TIMELAPSE_DAILY_STREAM_BASE = ":/camera/timelapse/daily/stream/";
const CAMERAS_MANAGER_TIMELAPSE_DAILY_STREAM = CAMERAS_MANAGER_TIMELAPSE_DAILY_STREAM_BASE + "[id]/";
const CAMERAS_MANAGER_TIMELAPSE_DAILY_STREAM_BASE_WITH_TOKEN = CAMERAS_MANAGER_TIMELAPSE_DAILY_STREAM_BASE + "token/";
const CAMERAS_MANAGER_TIMELAPSE_DAILY_STREAM_WITH_TOKEN = CAMERAS_MANAGER_TIMELAPSE_DAILY_STREAM_BASE_WITH_TOKEN + "[token]/[id]/";

const CAMERAS_MANAGER_TIMELAPSE_DAILY_GET_BASE = ":/camera/timelapse/daily/get/";
const CAMERAS_MANAGER_TIMELAPSE_DAILY_GET = CAMERAS_MANAGER_TIMELAPSE_DAILY_GET_BASE + "[id]/";
const CAMERAS_MANAGER_TIMELAPSE_GENERATE_POST_BASE = ":/camera/timelapse/set/";
const CAMERAS_MANAGER_TIMELAPSE_GENERATE_POST = CAMERAS_MANAGER_TIMELAPSE_GENERATE_POST_BASE + "[id]/[duration]/";
const CAMERAS_MANAGER_TIMELAPSE_STATUS_GET_BASE = ":/camera/timelapse/status/get/";
const CAMERAS_MANAGER_TIMELAPSE_STATUS_GET = CAMERAS_MANAGER_TIMELAPSE_STATUS_GET_BASE + "[token]/";
const CAMERAS_MANAGER_TIMELAPSE_GET_BASE = ":/camera/timelapse/get/";
const CAMERAS_MANAGER_TIMELAPSE_GET = CAMERAS_MANAGER_TIMELAPSE_GET_BASE + "[token]/";
const CAMERAS_MANAGER_TIMELAPSE_STREAM_BASE = ":/camera/timelapse/stream/";
const CAMERAS_MANAGER_TIMELAPSE_STREAM = CAMERAS_MANAGER_TIMELAPSE_STREAM_BASE + "[token]/";
const CAMERAS_MANAGER_TIMELAPSE_STREAM_BASE_WITH_TOKEN = CAMERAS_MANAGER_TIMELAPSE_STREAM_BASE + "token/";
const CAMERAS_MANAGER_TIMELAPSE_STREAM_WITH_TOKEN = CAMERAS_MANAGER_TIMELAPSE_STREAM_BASE_WITH_TOKEN + "[authToken]/[token]/";


const CAMERAS_MANAGER_LIST = ":/cameras/list/";
const CAMERAS_RETRIEVE_BASE = ":/camera/get/";
const CAMERAS_RETRIEVE_GET = CAMERAS_RETRIEVE_BASE + "[mode]/[id]/[base64*]/[timestamp*]/";
const CAMERAS_RETRIEVE_BASE_WITH_TOKEN = CAMERAS_RETRIEVE_BASE + "token/";
const CAMERAS_RETRIEVE_GET_WITH_TOKEN = CAMERAS_RETRIEVE_BASE_WITH_TOKEN + "[token]/[mode]/[id]/[base64*]/[timestamp*]/";
const CAMERAS_MOVE_BASE = ":/camera/move/";
const CAMERAS_MOVE_SET = CAMERAS_MOVE_BASE + "[id]/[direction]/";
const CAMERAS_RETRIEVE_GENERATE_TOKEN_BASE = ":/camera/generate-token/";
const CAMERAS_RETRIEVE_GENERATE_TOKEN = CAMERAS_RETRIEVE_GENERATE_TOKEN_BASE + "[id]/";

const MODE_STATIC = "static";
const MODE_MJPEG = "mjpeg";
const MODE_RTSP = "rtsp";

const DAILY_DURATION = 24 * 60 * 60;
const CAMERAS_RETENTION_TIME = 60 * 60 * 24 * 7; // In seconds
const CAMERA_FILE_EXTENSION = ".JPG";
const CAMERA_SEASON_EXTENSION = "-season";
const CAMERA_DAILY_EXTENSION = "-daily";

const ERROR_ALREADY_REGISTERED = "Already registered";
const ERROR_NOT_REGISTERED = "Not registered";
const ERROR_UNKNOWN_IDENTIFIER = "Unknown camera identifier";
const ERROR_NO_URL_DEFINED = "No url defined";
const ERROR_UNKNOWN_MODE = "Unknown mode";
const ERROR_UNSUPPORTED_MODE = "Unsupported mode";
const ERROR_TIMELAPSE_ALREADY_RUNNING = "TimeLapse already running";
const ERROR_TIMELAPSE_NOT_GENERATED = "Timelapse not generated";
const ERROR_UNKNOWN_TIMELAPSE_TOKEN = "Unknown timelapse token";
const ERROR_UNEXISTING_PICTURE = "Unexisting picture";
const ERROR_RECORD_ALREADY_RUNNING = "Already recording camera";
const ERROR_STREAM_INVALID_TOKEN = "Invalid token";


/**
 * This class allows to manage cameras
 * @class
 */
class CamerasManager {
    /**
     * Constructor
     *
     * @param  {PluginsManager} pluginsManager A plugin manager
     * @param  {EventEmitter} eventBus    The global event bus
     * @param  {WebServices} webServices    The web services
     * @param  {FormManager} formManager    The form manager
     * @param  {ConfManager} confManager    The configuration manager
     * @param  {TranslateManager} translateManager    The translate manager
     * @param  {ThemeManager} themeManager    The theme manager
     * @param  {DashboardManager} dashboardManager    The dashboard manager
     * @param  {TimeEventService} timeEventService    The time event service
     * @param  {Object} [camerasConfiguration=null]    Cameras configuration
     * @param  {string} [cachePath=null]    Temporary files path
     * @param  {string} [installationManager=null]    Installation manager
     * @returns {CamerasManager}                       The instance
     */
    constructor(pluginsManager, eventBus, webServices, formManager, confManager, translateManager, themeManager, dashboardManager, timeEventService, camerasConfiguration = null, cachePath = null, installationManager = null) {
        this.pluginsManager = pluginsManager;
        this.webServices = webServices;
        this.formManager = formManager;
        this.confManager = confManager;
        this.translateManager = translateManager;
        this.themeManager = themeManager;
        this.dashboardManager = dashboardManager;
        this.timeEventService = timeEventService;
        this.camerasArchiveFolder = (camerasConfiguration && camerasConfiguration.archiveFolder)?camerasConfiguration.archiveFolder:"/tmp/";
        this.cachePath = (cachePath)?cachePath:"/tmp/";
        this.enableHistory = (camerasConfiguration && camerasConfiguration.history)?camerasConfiguration.history:true;
        this.enableSeason = (camerasConfiguration && camerasConfiguration.season)?camerasConfiguration.season:true;
        this.enableTimelapse = (camerasConfiguration && camerasConfiguration.timelapse)?camerasConfiguration.timelapse:true;
        this.installationManager = installationManager;
        this.cameras = [];
        this.delegates = {};
        this.currentTimelapse = null;
        this.currentRecording = {};
        this.generatedTimelapses = {};
        this.tokens = {};

        try {
            this.camerasConfiguration = this.confManager.loadData(Object, CONF_MANAGER_KEY, true);
        } catch(e) {
            Logger.warn(e.message);
        }

        if (!this.camerasConfiguration) {
            this.camerasConfiguration = [];
        }

        const self = this;
        eventBus.on(PluginsManager.EVENT_LOADED, (pluginsManager) => {
            self.pluginsLoaded(pluginsManager, self);
        });

        // Web services
        this.webServices.registerAPI(this, WebServices.GET, CAMERAS_MANAGER_AVAILABLE_GET, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, CAMERAS_MANAGER_GET, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, CAMERAS_MANAGER_POST, Authentication.AUTH_ADMIN_LEVEL);
        this.webServices.registerAPI(this, WebServices.DELETE, CAMERAS_MANAGER_DEL, Authentication.AUTH_ADMIN_LEVEL);

        this.webServices.registerAPI(this, WebServices.GET, CAMERAS_RETRIEVE_GENERATE_TOKEN, Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, CAMERAS_MANAGER_LIST, Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, CAMERAS_RETRIEVE_GET, Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, CAMERAS_RETRIEVE_GET_WITH_TOKEN, Authentication.AUTH_NO_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, CAMERAS_MOVE_SET, Authentication.AUTH_USAGE_LEVEL);

        // Timelapse
        this.webServices.registerAPI(this, WebServices.GET, CAMERAS_MANAGER_TIMELAPSE_DAILY_STREAM, Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, CAMERAS_MANAGER_TIMELAPSE_DAILY_STREAM_WITH_TOKEN, Authentication.AUTH_NO_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, CAMERAS_MANAGER_TIMELAPSE_DAILY_GET, Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, CAMERAS_MANAGER_TIMELAPSE_GENERATE_POST, Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, CAMERAS_MANAGER_TIMELAPSE_STATUS_GET, Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, CAMERAS_MANAGER_TIMELAPSE_GET, Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, CAMERAS_MANAGER_TIMELAPSE_STREAM, Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, CAMERAS_MANAGER_TIMELAPSE_STREAM_WITH_TOKEN, Authentication.AUTH_NO_LEVEL);

        // Register tile refresh :)
        this.timeEventService.register((self) => {
            self.registerTile(self);
        }, this, TimeEventService.EVERY_HOURS);

        this.timeEventService.register((self) => {
            self.archiveCameras(self);
        }, this, TimeEventService.EVERY_MINUTES);

        this.timeEventService.register((self) => {
            self.generateDailyTimeLapses(self);
        }, this, TimeEventService.EVERY_DAYS);
    }

    /**
     * Called automatically when plugins are loaded. Used in separate methods for testing.
     * Initially, this method wad used in contructor.
     *
     * @param  {PluginsManager} pluginsManager The plugins manager instance
     * @param  {CamerasManager} context        The context (self, this, etc ...)
     */
    pluginsLoaded(pluginsManager, context) {
        context.pluginsManager = pluginsManager;
        context.initCameras();
        context.registerCamerasListForm();
        context.registerTile(context);

        //this.record(1503653182, (err, s) => {});
    }

    /**
     * Archive all cameras
     *
     * @param  {CamerasManager} context The instance
     */
    archiveCameras(context) {
        const timestamp = DateUtils.class.roundedTimestamp(DateUtils.class.timestamp(), DateUtils.ROUND_TIMESTAMP_MINUTE);
        if (context.camerasArchiveFolder) {
            context.cameras.forEach((camera) => {
                // All time
                if (this.enableHistory) {
                    const cameraArchiveFolder = context.camerasArchiveFolder + camera.id + "/";
                    try {
                        fs.accessSync(cameraArchiveFolder);
                    } catch(e) {
                        fs.mkdirsSync(cameraArchiveFolder);
                    } finally {
                        // Clean
                        fs.readdir(cameraArchiveFolder, (err, files) => {
                            files.forEach((file) => {
                                if (!err) {
                                    const fileTimestamp = file.split(".")[0];
                                    if (fileTimestamp && parseInt(fileTimestamp) < (timestamp - CAMERAS_RETENTION_TIME)) {
                                        fs.unlink(cameraArchiveFolder + file, (error) => {
                                            if (error) {
                                                Logger.err("Error while deleting file " + file + " camera archive for id " + camera.id);
                                                Logger.err(err.message);
                                            }
                                        });
                                    }
                                } else {
                                    Logger.err("Error while listing camera archive for id " + camera.id);
                                    Logger.err(err.message);
                                }
                            });
                        });

                        // Save camera
                        context.getImage(camera.id, (err, data) => {
                            if (!err) {
                                fs.writeFile(cameraArchiveFolder + timestamp + CAMERA_FILE_EXTENSION, data,  (err) => {
                                    if (err) {
                                        Logger.err("Error while writing camera archive for id " + camera.id);
                                        Logger.err(err.message);
                                    }
                                });
                            }
                        });
                    }
                }

                // Seasons
                if (this.enableSeason) {
                    const cameraArchiveFolderSeason = context.camerasArchiveFolder + camera.id + CAMERA_SEASON_EXTENSION + "/";
                    try {
                        fs.accessSync(cameraArchiveFolderSeason);
                    } catch(e) {
                        fs.mkdirsSync(cameraArchiveFolderSeason);
                    } finally {
                        // Camera name
                        const minute = parseInt(DateUtils.class.dateFormatted("mm", timestamp));
                        const hour = parseInt(DateUtils.class.dateFormatted("HH", timestamp));

                        if (parseInt(hour) === 12 && parseInt(minute) === 0) {
                            const day = parseInt(DateUtils.class.dateFormatted("DD", timestamp));
                            const month = parseInt(DateUtils.class.dateFormatted("MM", timestamp));
                            const dailyTimestamp = minute * 60 + hour * 60 * 60 + day * 24 * 60 * 60 + month * 31 * 24 * 60 * 60;
                            // Save camera
                            context.getImage(camera.id, (err, data) => {
                                if (!err) {
                                    fs.writeFile(cameraArchiveFolderSeason + dailyTimestamp + CAMERA_FILE_EXTENSION, data,  (err) => {
                                        if (err) {
                                            Logger.err("Error while writing camera archive for id " + camera.id);
                                            Logger.err(err.message);
                                        }
                                    });
                                }
                            });
                        }
                    }
                }
            });
        }
    }

    /**
     * Initialize cameras
     */
    initCameras() {
        this.cameras = [];
        this.camerasConfiguration.forEach((cameraConfiguration) => {
            this.initCamera(cameraConfiguration);
        });

        // Register forms
        const ids = [];
        const names = [];
        this.cameras.forEach((camera) => {
            ids.push(camera.id);
            names.push(camera.name);
        });
        this.formManager.register(CamerasForm.class, ids, names);
        this.registerTile(this);
    }

    /**
     * Init a camera instance and add to local array
     *
     * @param  {Object} configuration The camera configuration
     */
    initCamera(configuration) {
        if (configuration.plugin) {
            const p = this.pluginsManager.getPluginByIdentifier(configuration.plugin, false);
            if (p) {
                if (p.cameraAPI.cameraClass) {
                    const camera = new p.cameraAPI.cameraClass(p, configuration.id, configuration);
                    camera.init();
                    this.cameras.push(camera);

                    Logger.info("Camera '" + configuration.name + "' loaded (#" + configuration.id + ")");
                } else {
                    Logger.err("Plugin " + configuration.plugin + " does not have linked camera class");
                }
            } else {
                Logger.err("Plugin " + configuration.plugin + " can not be found");
            }
        } else {
            Logger.err("No plugin associated found for camera " + configuration.name);
        }
    }

    /**
     * Get all cameras
     *
     * @returns {Object} On object with id:name
     */
    getAllCameras() {
        const cameras = {};
        this.cameras.forEach((camera) => {
            cameras[camera.id] = camera.name;
        });

        return cameras;
    }

    /**
     * Register camera tile
     *
     * @param  {CamerasManager} context The instance
     */
    registerTile(context) {
        let tile = new Tile.class(context.dashboardManager.themeManager, "cameras", Tile.TILE_ACTION_ONE_ICON, Icons.class.list()["facetime_video"], null, context.translateManager.t("cameras.tile"), null, null, null, 0, 100, "cameras");
        if (context.cameras.length > 0) {
            context.dashboardManager.registerTile(tile);
        }

        const defaultCamera = context.getDefaultCamera();
        if (defaultCamera) {
            context.getImage(defaultCamera.id, (err, data) => {
                if (!err) {
                    ImageUtils.class.resize(data.toString("base64"), (error, tData) => {
                        tile = new Tile.class(context.dashboardManager.themeManager, "cameras", Tile.TILE_PICTURE_TEXT, null, null, context.translateManager.t("cameras.tile"), null, tData, null, 0, 100, "cameras");
                        if (context.cameras.length > 0) {
                            context.dashboardManager.registerTile(tile);
                        }
                    }, 300);
                }
            });
        }
    }

    /**
     * Process API callback
     *
     * @param  {APIRequest} apiRequest An APIRequest
     * @returns {Promise}  A promise with an APIResponse object
     */
    processAPI(apiRequest) {
        const self = this;
        if (apiRequest.route === CAMERAS_MANAGER_AVAILABLE_GET) {
            return new Promise((resolve) => {
                const cameras = [];
                self.pluginsManager.getPluginsByCategory("camera", false).forEach((camera) => {
                    if (camera.cameraAPI.form) {
                        cameras.push({
                            identifier: camera.identifier,
                            description: camera.description,
                            form:self.formManager.getForm(camera.cameraAPI.form)
                        });
                    }
                });
                resolve(new APIResponse.class(true, cameras));
            });
        } else if (apiRequest.route === CAMERAS_MANAGER_GET) {
            return new Promise((resolve) => {
                const cameras = [];
                self.camerasConfiguration.forEach((camera) => {
                    const cameraPlugin = self.pluginsManager.getPluginByIdentifier(camera.plugin, false);
                    cameras.push({
                        identifier: camera.id,
                        name: camera.name,
                        icon: "E8BC",
                        category:"TEST",
                        form:Object.assign(self.formManager.getForm(cameraPlugin.cameraAPI.form), {data:camera})
                    });
                });
                resolve(new APIResponse.class(true, cameras.sort((a,b) => a.name.localeCompare(b.name))));
            });
        } else if (apiRequest.route.startsWith(CAMERAS_MANAGER_POST_BASE)) {
            return new Promise((resolve, reject) => {
                if (apiRequest.data) {
                    if (apiRequest.data.plugin) {
                        if (self.pluginsManager.getPluginByIdentifier(apiRequest.data.plugin, false)) {
                            // Set id
                            if (!apiRequest.data.id) {
                                apiRequest.data.id = DateUtils.class.timestamp();
                            } else {
                                apiRequest.data.id = parseInt(apiRequest.data.id);
                            }

                            self.camerasConfiguration = self.confManager.setData(CONF_MANAGER_KEY, apiRequest.data, self.camerasConfiguration, self.comparator);
                            self.initCameras();
                            resolve(new APIResponse.class(true, {success:true}));
                        } else {
                            reject(new APIResponse.class(false, {}, 8108, "Unexisting plugin found"));
                        }
                    } else {
                        reject(new APIResponse.class(false, {}, 8107, "No plugin attached"));
                    }
                } else {
                    reject(new APIResponse.class(false, {}, 8106, "No data request"));
                }

            });
        } else if (apiRequest.route.startsWith(CAMERAS_MANAGER_DEL_BASE)) {
            return new Promise((resolve, reject) => {
                try {
                    self.confManager.removeData(CONF_MANAGER_KEY, {id:parseInt(apiRequest.data.id)}, self.camerasConfiguration, self.comparator);
                    self.initCameras();
                    resolve(new APIResponse.class(true, {success:true}));
                } catch(e) {
                    reject(new APIResponse.class(false, {}, 8109, e.message));
                }
            });
        } else if (apiRequest.route === CAMERAS_MANAGER_LIST) {
            return new Promise((resolve) => {
                resolve(new APIResponse.class(true, self.getCamerasList().sort((a,b) => a.name.localeCompare(b.name))));
            });
        } else if (apiRequest.route.startsWith(CAMERAS_RETRIEVE_GENERATE_TOKEN_BASE)) {
            return new Promise((resolve, reject) => {
                const id = parseInt(apiRequest.data.id);
                const camera = this.getCamera(id);
                if (camera) {
                    this.tokens[id] = sha256((id + DateUtils.class.timestamp() + ((Math.random() * 10000000) + 1)).toString()).substr(((Math.random() * 40) + 1), 16);
                    resolve(new APIResponse.class(true, {token:this.tokens[id]}));
                } else {
                    reject(new APIResponse.class(false, {}, 766, ERROR_UNKNOWN_IDENTIFIER));
                }
            });
        } else if (apiRequest.route.startsWith(CAMERAS_RETRIEVE_BASE) || apiRequest.route.startsWith(CAMERAS_RETRIEVE_BASE_WITH_TOKEN)) {

            const id = parseInt(apiRequest.data.id);
            const mode = apiRequest.data.mode;
            const base64 = apiRequest.data.base64?(parseInt(apiRequest.data.base64)>0?true:false):false;
            const token = apiRequest.data.token;
            const tokenMode = apiRequest.route.startsWith(CAMERAS_RETRIEVE_BASE_WITH_TOKEN);

            return new Promise((resolve, reject) => {
                if (tokenMode && (!token || !this.tokens[id] || token != this.tokens[id])) {
                    reject(new APIResponse.class(false, {}, 798, ERROR_STREAM_INVALID_TOKEN));
                } else {
                    this.tokens[id] = null;
                    if (mode === MODE_STATIC) {
                        self.getImage(id, (err, data, contentType) => {
                            if (err) {
                                reject(new APIResponse.class(false, {}, 765, err.message));
                            } else if (base64) {
                                resolve(new APIResponse.class(true, {data:data.toString("base64")}));
                            } else {
                                resolve(new APIResponse.class(true, data, null, null, false, contentType));
                            }
                        }, apiRequest.data.timestamp?apiRequest.data.timestamp:null);
                    } else if (mode === MODE_MJPEG) {
                        const camera = this.getCamera(id);
                        if (camera) {
                            if (camera.mjpegUrl) {
                                apiRequest.res  = new MjpegProxy(camera.mjpegUrl).proxyRequest(apiRequest.req, apiRequest.res);
                            } else {
                                reject(new APIResponse.class(false, {}, 766, ERROR_UNSUPPORTED_MODE));
                            }
                        } else {
                            reject(new APIResponse.class(false, {}, 766, ERROR_UNKNOWN_IDENTIFIER));
                        }
                    } else if (mode === MODE_RTSP) {
                        const camera = this.getCamera(id);
                        if (camera) {
                            if (camera.rtspUrl) {
                                apiRequest.res  = new MjpegProxy(camera.rtspUrl).proxyRequest(apiRequest.req, apiRequest.res);
                            } else {
                                reject(new APIResponse.class(false, {}, 766, ERROR_UNSUPPORTED_MODE));
                            }
                        } else {
                            reject(new APIResponse.class(false, {}, 766, ERROR_UNKNOWN_IDENTIFIER));
                        }
                    } else {
                        reject(new APIResponse.class(false, {}, 764, ERROR_UNKNOWN_MODE));
                    }
                }
            });
        } else if (apiRequest.route.startsWith(CAMERAS_MOVE_BASE)) {
            return new Promise((resolve, reject) => {
                const id = parseInt(apiRequest.data.id);
                const direction = apiRequest.data.direction;
                const camera = this.getCamera(id);
                if (camera) {
                    if (camera.moveSupport()) {
                        switch(direction) {
                        case 1:
                            camera.moveLeft();
                            break;
                        case 2:
                            camera.moveRight();
                            break;
                        case 3:
                            camera.moveUp();
                            break;
                        case 4:
                            camera.moveDown();
                            break;
                        }

                        resolve(new APIResponse.class(true, {success:true}));
                    } else {
                        reject(new APIResponse.class(false, {}, 766, ERROR_UNSUPPORTED_MODE));
                    }
                } else {
                    reject(new APIResponse.class(false, {}, 766, ERROR_UNKNOWN_IDENTIFIER));
                }
            });
        } else if (apiRequest.route.startsWith(CAMERAS_MANAGER_TIMELAPSE_DAILY_STREAM_BASE) || apiRequest.route.startsWith(CAMERAS_MANAGER_TIMELAPSE_DAILY_STREAM_BASE_WITH_TOKEN)) {
            return new Promise((resolve, reject) => {
                const id = parseInt(apiRequest.data.id);
                const token = apiRequest.data.token;
                const tokenMode = apiRequest.route.startsWith(CAMERAS_MANAGER_TIMELAPSE_DAILY_STREAM_BASE_WITH_TOKEN);

                if (tokenMode && (!token || !this.tokens[id] || token != this.tokens[id])) {
                    reject(new APIResponse.class(false, {}, 798, ERROR_STREAM_INVALID_TOKEN));
                } else {
                    this.tokens[id] = null;
                    const camera = this.getCamera(apiRequest.data.id);
                    if (camera) {
                        const dailyFilepath = this.dailyFilepath(camera, this.camerasArchiveFolder);
                        if (fs.existsSync(dailyFilepath)) {
                            fs.stat(dailyFilepath, (err, stats) => {
                                if (err) {
                                    if (err.code === "ENOENT") {
                                        // 404 Error if file not found
                                        apiRequest.res.sendStatus(404);
                                    }
                                    apiRequest.res.end(err);
                                }
                                const range = apiRequest.req.headers.range;
                                if (!range) {
                                    // 416 Wrong range
                                    return apiRequest.res.sendStatus(416);
                                }
                                const positions = range.replace(/bytes=/, "").split("-");
                                const start = parseInt(positions[0], 10);
                                const total = stats.size;
                                const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
                                const chunksize = (end - start) + 1;

                                apiRequest.res.writeHead(206, {
                                    "Content-Range": "bytes " + start + "-" + end + "/" + total,
                                    "Accept-Ranges": "bytes",
                                    "Content-Length": chunksize,
                                    "Content-Type": "video/mp4"
                                });

                                const stream = fs.createReadStream(dailyFilepath, { start: start, end: end })
                                    .on("open", function() {
                                        stream.pipe(apiRequest.res);
                                    }).on("error", function(err) {
                                        apiRequest.res.end(err);
                                    });
                            });
                        } else {
                            reject(new APIResponse.class(false, {}, 770, ERROR_TIMELAPSE_NOT_GENERATED));
                        }
                    } else {
                        reject(new APIResponse.class(false, {}, 766, ERROR_UNKNOWN_IDENTIFIER));
                    }
                }
            });
        } else if (apiRequest.route.startsWith(CAMERAS_MANAGER_TIMELAPSE_DAILY_GET_BASE)) {
            return new Promise((resolve, reject) => {
                const camera = this.getCamera(apiRequest.data.id);
                if (camera) {
                    const dailyFilepath = this.dailyFilepath(camera, this.camerasArchiveFolder);
                    if (fs.existsSync(dailyFilepath)) {
                        apiRequest.res.setHeader("Content-disposition", "attachment; filename=daily-" + camera.id + TimelapseGenerator.VIDEO_EXTENSION);
                        apiRequest.res.setHeader("Content-type", "video/mp4");
                        const filestream = fs.createReadStream(dailyFilepath);
                        filestream.pipe(apiRequest.res);
                    } else {
                        reject(new APIResponse.class(false, {}, 770, ERROR_TIMELAPSE_NOT_GENERATED));
                    }
                } else {
                    reject(new APIResponse.class(false, {}, 766, ERROR_UNKNOWN_IDENTIFIER));
                }
            });
        } else if (apiRequest.route.startsWith(CAMERAS_MANAGER_TIMELAPSE_GENERATE_POST_BASE)) {
            return new Promise((resolve, reject) => {
                const camera = this.getCamera(apiRequest.data.id);
                const duration = parseInt(apiRequest.data.duration);
                if (camera) {
                    try {
                        this.generateTimelapse(camera.id, duration);
                        resolve(new APIResponse.class(true, {token:this.currentTimelapse.token}));
                    } catch(e) {
                        reject(new APIResponse.class(false, {}, 782, e.message));
                    }
                } else {
                    reject(new APIResponse.class(false, {}, 766, ERROR_UNKNOWN_IDENTIFIER));
                }
            });
        } else if (apiRequest.route.startsWith(CAMERAS_MANAGER_TIMELAPSE_STATUS_GET_BASE)) {
            return new Promise((resolve, reject) => {
                if (this.generatedTimelapses[apiRequest.data.token]) {
                    resolve(new APIResponse.class(true, {token:apiRequest.data.token, status:this.timelapseStatus(apiRequest.data.token)}));
                } else {
                    reject(new APIResponse.class(false, {}, 774, ERROR_UNKNOWN_TIMELAPSE_TOKEN));
                }
            });
        } else if (apiRequest.route.startsWith(CAMERAS_MANAGER_TIMELAPSE_GET_BASE)) {
            return new Promise((resolve, reject) => {
                if (this.generatedTimelapses[apiRequest.data.token]) {
                    if (fs.existsSync(this.generatedTimelapses[apiRequest.data.token].path)) {
                        apiRequest.res.setHeader("Content-disposition", "attachment; filename=daily-" + apiRequest.data.token + TimelapseGenerator.VIDEO_EXTENSION);
                        apiRequest.res.setHeader("Content-type", "video/mp4");
                        const filestream = fs.createReadStream(this.generatedTimelapses[apiRequest.data.token].path);
                        filestream.pipe(apiRequest.res);
                    } else {
                        reject(new APIResponse.class(false, {}, 770, ERROR_TIMELAPSE_NOT_GENERATED));
                    }
                } else {
                    reject(new APIResponse.class(false, {}, 774, ERROR_UNKNOWN_TIMELAPSE_TOKEN));
                }
            });
        } else if (apiRequest.route.startsWith(CAMERAS_MANAGER_TIMELAPSE_STREAM_BASE) || apiRequest.route.startsWith(CAMERAS_MANAGER_TIMELAPSE_STREAM_BASE_WITH_TOKEN)) {
            return new Promise((resolve, reject) => {
                const id = parseInt(apiRequest.data.id);
                const token = apiRequest.data.authToken;
                const tokenMode = apiRequest.route.startsWith(CAMERAS_MANAGER_TIMELAPSE_STREAM_BASE_WITH_TOKEN);

                if (tokenMode && (!token || !this.tokens[id] || token != this.tokens[id])) {
                    reject(new APIResponse.class(false, {}, 798, ERROR_STREAM_INVALID_TOKEN));
                } else {
                    if (this.generatedTimelapses[apiRequest.data.token]) {
                        if (fs.existsSync(this.generatedTimelapses[apiRequest.data.token].path)) {
                            fs.stat(this.generatedTimelapses[apiRequest.data.token].path, (err, stats) => {
                                if (err) {
                                    if (err.code === "ENOENT") {
                                        // 404 Error if file not found
                                        apiRequest.res.sendStatus(404);
                                    }
                                    apiRequest.res.end(err);
                                }
                                const range = apiRequest.req.headers.range;
                                if (!range) {
                                    // 416 Wrong range
                                    return apiRequest.res.sendStatus(416);
                                }
                                const positions = range.replace(/bytes=/, "").split("-");
                                const start = parseInt(positions[0], 10);
                                const total = stats.size;
                                const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
                                const chunksize = (end - start) + 1;

                                apiRequest.res.writeHead(206, {
                                    "Content-Range": "bytes " + start + "-" + end + "/" + total,
                                    "Accept-Ranges": "bytes",
                                    "Content-Length": chunksize,
                                    "Content-Type": "video/mp4"
                                });

                                const stream = fs.createReadStream(this.generatedTimelapses[apiRequest.data.token].path, { start: start, end: end })
                                    .on("open", function() {
                                        stream.pipe(apiRequest.res);
                                    }).on("error", function(err) {
                                        apiRequest.res.end(err);
                                    });
                            });
                        } else {
                            reject(new APIResponse.class(false, {}, 770, ERROR_TIMELAPSE_NOT_GENERATED));
                        }
                    } else {
                        reject(new APIResponse.class(false, {}, 774, ERROR_UNKNOWN_TIMELAPSE_TOKEN));
                    }
                }
            });
        }
    }

    /**
     * Compare camera data
     *
     * @param  {Object} cameraData1 Camera data 1
     * @param  {Object} cameraData2 Camera data 2
     * @returns {boolean}             True if id is the same, false otherwise
     */
    comparator(cameraData1, cameraData2) {
        return (cameraData1.id === cameraData2.id);
    }

    /**
     * Get camera configuration. If no parameters are passed, returns the array of all camera configuration.
     *
     * @param  {string} [cameraId=null] The camera identifier. Can be null.
     * @returns {Object}                 The camera configuration, or configurations, or null if nothing found
     */
    getCameraConfiguration(cameraId = null) {
        if (!cameraId) {
            return this.camerasConfiguration;
        } else {
            let foundConfiguration = null;
            this.camerasConfiguration.forEach((cameraConfiguration) => {
                if (cameraConfiguration.id === cameraId) {
                    foundConfiguration = cameraConfiguration;
                }
            });

            return foundConfiguration;
        }
    }

    /**
     * Register a cameras list form
     */
    registerCamerasListForm() {
        const camerasName = [];
        const camerasId = [];
        this.camerasConfiguration.sort((a,b) => a.name.localeCompare(b.name)).forEach((camera) => {
            camerasName.push(camera.name);
            camerasId.push(camera.id);
        });
        this.formManager.register(CamerasListForm.class, camerasName, camerasId);
    }

    /**
     * Retrieve the list of cameras with name and identifier
     *
     * @returns {Array} The list of cameras
     */
    getCamerasList() {
        const cameras = [];
        this.cameras.forEach((camera) => {
            cameras.push({id:camera.id, name:camera.name, mjpeg:camera.mjpegSupport(), rtsp:camera.rtspSupport(), move:camera.moveSupport()});
        });

        return cameras;
    }

    /**
     * Get the camera Object
     *
     * @param  {number} id Camera identifier
     * @returns {Camera}    A camera extended object. Returns null if nothing found.
     */
    getCamera(id) {
        let camera = null;
        this.cameras.forEach((cam) => {
            if (cam.id === parseInt(id)) {
                camera = cam;
            }
        });

        return camera;
    }

    /**
     * Get the default camera
     *
     * @returns {Camera} A default camera
     */
    getDefaultCamera() {
        let camera = null;
        this.cameras.forEach((cam) => {
            if (cam.default) {
                camera = cam;
            }
        });

        return camera;
    }

    /**
     * Get a picture
     *
     * @param  {number}   id Camera identifier
     * @param  {Function} cb         A callback with error, image buffer and mime type. Example : `(err, data, mime) => {}`
     * @param  {number}   [timestamp=null] The timestamp of the picture. If `null`, live snapshot.
     */
    getImage(id, cb, timestamp = null) {
        if (id) {
            const camera = this.getCamera(id);
            if (camera) {
                if (timestamp) {
                    const filePath = this.camerasArchiveFolder + camera.id + "/" + timestamp + CAMERA_FILE_EXTENSION;
                    if (fs.existsSync(filePath)) {
                        fs.readFile(filePath, (err, data) => {
                            if (err) {
                                cb(err);
                            } else {
                                cb(null, new Buffer(data, "binary"), "image/jpeg");
                            }
                        });
                    } else {
                        cb(Error(ERROR_UNEXISTING_PICTURE));
                    }
                } else {
                    if (camera.snapshotUrl) {
                        Logger.info("Retrieving picture from camera " + id);
                        request(camera.snapshotUrl, {encoding: "binary"}, function(error, response, body) {
                            if (error) {
                                Logger.err("Camera picture " + id + " error");
                                Logger.err(error);
                                cb(error);
                            } else {
                                Logger.info("Camera picture " + id + " done !");
                                cb(null, new Buffer(body, "binary"), response.headers["content-type"]);
                            }
                        });
                    } else {
                        cb(Error(ERROR_NO_URL_DEFINED));
                    }
                }
            } else {
                cb(Error(ERROR_UNKNOWN_IDENTIFIER));
            }
        } else {
            cb(Error(ERROR_UNKNOWN_IDENTIFIER));
        }
    }

    /**
     * Retrieve a timelapse status for a specific token
     *
     * @param  {string} token Time lapse token
     * @returns {number}       The status
     */
    timelapseStatus(token) {
        if (this.currentTimelapse && (token === this.currentTimelapse.token)) {
            return this.currentTimelapse.status;
        } else {
            if (this.generatedTimelapses[token]) {
                return this.generatedTimelapses[token].status;
            }
        }

        return null;
    }

    /**
     * Get the daily timelapse file path
     *
     * @param  {Camera} camera               A camera
     * @param  {string} camerasArchiveFolder Camera archive folder
     * @returns {string}                      The path
     */
    dailyFilepath(camera, camerasArchiveFolder) {
        return camerasArchiveFolder + camera.id + CAMERA_DAILY_EXTENSION + TimelapseGenerator.VIDEO_EXTENSION;
    }

    /**
     * Generate a daily timelapse
     *
     * @param  {CamerasManager} context The context (self)
     */
    generateDailyTimeLapses(context) {
        Logger.info("Timelapse camera generation requested");
        if (context.enableTimelapse) {
            Logger.info("Timelapse enabled");
            context.cameras.forEach((camera) => {
                const timelapse = new TimelapseGenerator.class(camera, context.installationManager, context.cachePath, context.camerasArchiveFolder, DAILY_DURATION);
                timelapse.generateTimelapse((status, error, timelapseFilepath) => {
                    if (!error && timelapseFilepath) {
                        const dailyFilename = context.dailyFilepath(camera, context.camerasArchiveFolder);
                        fs.remove(dailyFilename);
                        fs.move(timelapseFilepath, dailyFilename);
                    }
                });
            });
        }
    }

    /**
     * Generate a timelapse for a camera id
     *
     * @param  {number} id           The camera identifier
     * @param  {number} [duration=24 * 60 * 60] The duration in seconds
     */
    generateTimelapse(id, duration = 24 * 60 * 60) {
        if (!this.currentTimelapse) {
            const camera = this.getCamera(id);
            if (camera) {
                this.currentTimelapse = new TimelapseGenerator.class(camera, this.installationManager, this.cachePath, this.camerasArchiveFolder, duration);
                this.generatedTimelapses[this.currentTimelapse.token] = {
                    status:this.currentTimelapse.status,
                    path:null
                };
                this.currentTimelapse.generateTimelapse((status, error, timelapseFilepath) => {
                    this.generatedTimelapses[this.currentTimelapse.token] = {
                        status:status,
                        path:timelapseFilepath?timelapseFilepath:null
                    };

                    this.currentTimelapse = null;
                });
            } else {
                throw Error(ERROR_UNKNOWN_IDENTIFIER);
            }
        } else {
            throw Error(ERROR_TIMELAPSE_ALREADY_RUNNING);
        }
    }

    /**
     * Record a video session for a specific camera
     *
     * @param  {number}   id         The camera identifier
     * @param  {Function} cb         A callback `(err, generatedFilepath) => {}`
     * @param  {number}   [timer=60] Duration of capture in seconds
     */
    record(id, cb, timer = 60) {
        if (!this.currentRecording[parseInt(id)]) {
            this.currentRecording[parseInt(id)] = {};
            const camera = this.getCamera(id);
            if (camera.mjpegUrl) {
                const recordSessionFile = this.cachePath + id + "-" + DateUtils.class.timestamp() + "-record";
                Logger.info("Recording video for camera " + id + " for " + timer + " seconds");
                let frameCount = 0;
                const wstream = fs.createWriteStream(recordSessionFile + ".mjpg");
                const req = request(camera.mjpegUrl);
                const PassThrough = require("stream").PassThrough;
                const pt = new PassThrough();
                req.pipe(pt).pipe(wstream);
                pt.on("data", (chunk) => {
                    if (chunk.toString("utf8").indexOf("JFIF")!==-1) {
                        frameCount++;
                    }
                });
                setTimeout((vwstream, vreq) => {
                    vwstream.end();
                    vreq.abort();
                    const frameRate = Math.round(frameCount / timer);
                    Logger.info("Record session stop");
                    delete this.currentRecording[parseInt(id)];
                    Logger.info("Detected frames : " + frameCount);
                    Logger.info("Detected framerate : " + frameRate);
                    Logger.info("Converting video session");

                    this.installationManager.executeCommand("avconv -r " + ((frameRate < 1) ? 1:frameRate) + " -i " + recordSessionFile + ".mjpg -vcodec libx264 " + recordSessionFile + ".mp4", false, (error, stdout, stderr) => {
                        // Clean mjpg stream
                        fs.remove(recordSessionFile + ".mjpg");
                        if (error) {
                            Logger.err(stderr);
                            cb(error);
                        } else {
                            Logger.info("Video session encoding terminated.");
                            cb(null, recordSessionFile + ".mp4");
                        }
                    });
                }, timer * 1000, wstream, req);
            } else {
                cb(Error(ERROR_UNSUPPORTED_MODE));
            }
        } else {
            cb(Error(ERROR_RECORD_ALREADY_RUNNING));
        }
    }
}

module.exports = {class:CamerasManager, ERROR_ALREADY_REGISTERED:ERROR_ALREADY_REGISTERED, ERROR_NOT_REGISTERED:ERROR_NOT_REGISTERED, ERROR_TIMELAPSE_ALREADY_RUNNING:ERROR_TIMELAPSE_ALREADY_RUNNING, CAMERA_FILE_EXTENSION:CAMERA_FILE_EXTENSION, ERROR_TIMELAPSE_NOT_GENERATED:ERROR_TIMELAPSE_NOT_GENERATED};
