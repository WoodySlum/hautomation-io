"use strict";
const request = require("request");
const MjpegProxy = require("mjpeg-proxy").MjpegProxy;
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

const CONF_MANAGER_KEY = "cameras";
const CAMERAS_MANAGER_AVAILABLE_GET = ":/cameras/available/get/";
const CAMERAS_MANAGER_POST_BASE = ":/cameras/set";
const CAMERAS_MANAGER_POST = CAMERAS_MANAGER_POST_BASE + "/[id*]/";
const CAMERAS_MANAGER_GET = ":/cameras/get/";
const CAMERAS_MANAGER_DEL_BASE = ":/cameras/del";
const CAMERAS_MANAGER_DEL = CAMERAS_MANAGER_DEL_BASE + "/[id*]/";

const CAMERAS_MANAGER_LIST = ":/cameras/list/";
const CAMERAS_RETRIEVE_BASE = ":/camera/get/";
const CAMERAS_RETRIEVE_GET = CAMERAS_RETRIEVE_BASE + "[mode]/[id]/[base64*]/";
const CAMERAS_MOVE_BASE = ":/camera/move/";
const CAMERAS_MOVE_SET = CAMERAS_MOVE_BASE + "[id]/[direction]/";

const MODE_STATIC = "static";
const MODE_MJPEG = "mjpeg";
const MODE_RTSP = "rtsp";

const ERROR_ALREADY_REGISTERED = "Already registered";
const ERROR_NOT_REGISTERED = "Not registered";
const ERROR_UNKNOWN_IDENTIFIER = "Unknown camera identifier";
const ERROR_NO_URL_DEFINED = "No url defined";
const ERROR_UNKNOWN_MODE = "Unknown mode";
const ERROR_UNSUPPORTED_MODE = "Unsupported mode";


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
     * @returns {CamerasManager}                       The instance
     */
    constructor(pluginsManager, eventBus, webServices, formManager, confManager, translateManager, themeManager, dashboardManager, timeEventService) {
        this.pluginsManager = pluginsManager;
        this.webServices = webServices;
        this.formManager = formManager;
        this.confManager = confManager;
        this.translateManager = translateManager;
        this.themeManager = themeManager;
        this.dashboardManager = dashboardManager;
        this.timeEventService = timeEventService;
        this.cameras = [];
        this.delegates = {};

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

        this.webServices.registerAPI(this, WebServices.GET, CAMERAS_MANAGER_LIST, Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.GET, CAMERAS_RETRIEVE_GET, Authentication.AUTH_USAGE_LEVEL);
        this.webServices.registerAPI(this, WebServices.POST, CAMERAS_MOVE_SET, Authentication.AUTH_USAGE_LEVEL);

        // Register tile refresh :)
        this.timeEventService.register((self) => {
            self.registerTile(self);
        }, this, TimeEventService.EVERY_HOURS);
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
        this.registerCamerasListForm();
        this.registerTile(this);
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
                resolve(new APIResponse.class(true, cameras));
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
                resolve(new APIResponse.class(true, self.getCamerasList()));
            });
        } else if (apiRequest.route.startsWith(CAMERAS_RETRIEVE_BASE)) {
            const id = parseInt(apiRequest.data.id);
            const mode = apiRequest.data.mode;
            const base64 = apiRequest.data.base64?(parseInt(apiRequest.data.base64)>0?true:false):false;
            return new Promise((resolve, reject) => {
                if (mode === MODE_STATIC) {
                    self.getImage(id, (err, data, contentType) => {
                        if (err) {
                            reject(new APIResponse.class(false, {}, 765, err.message));
                        } else if (base64) {
                            resolve(new APIResponse.class(true, {data:data.toString("base64")}));
                        } else {
                            resolve(new APIResponse.class(true, data, null, null, false, contentType));
                        }
                    });
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
        this.camerasConfiguration.forEach((camera) => {
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
     */
    getImage(id, cb) {
        if (id) {
            const camera = this.getCamera(id);
            if (camera) {
                if (camera.snapshotUrl) {
                    Logger.info("Retrieving picture from camera " + id);
                    request(camera.snapshotUrl, {encoding: "binary"}, function(error, response, body) {
                        if (error) {
                            Logger.err("Camera picture " + id + " error");
                            Logger.err(console.error);
                            cb(error);
                        } else {
                            Logger.info("Camera picture " + id + " done !");
                            cb(null, new Buffer(body, "binary"), response.headers["content-type"]);
                        }
                    });
                } else {
                    cb(Error(ERROR_NO_URL_DEFINED));
                }
            } else {
                cb(Error(ERROR_UNKNOWN_IDENTIFIER));
            }
        } else {
            cb(Error(ERROR_UNKNOWN_IDENTIFIER));
        }
    }
}

module.exports = {class:CamerasManager, ERROR_ALREADY_REGISTERED:ERROR_ALREADY_REGISTERED, ERROR_NOT_REGISTERED:ERROR_NOT_REGISTERED};