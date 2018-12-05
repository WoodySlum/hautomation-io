"use strict";
const fs = require("fs-extra");
const fsReadDirRecursive = require("fs-readdir-recursive");
const path = require("path");
const md5File = require("md5-file");
const zipdir = require("zip-dir");
const extractzip = require("extract-zip");
const DateUtils = require("./../../utils/DateUtils");
const Logger = require("./../../logger/Logger");
const ConfManager = require("./../confmanager/ConfManager");
const HautomationRunnerConstants = require("./../../../HautomationRunnerConstants");
const DATA_TYPE_CONF = 0;
const DATA_TYPE_DB = 1;
const DATA_TYPE_CAMERA = 2;
const RESTART_TIMER = 5;
const DESCRIPTOR = "descriptor.json";

/**
 * This class allows to manage backups
 * @class
 */
class BackupManager {
    /**
     * Constructor
     *
     * @param  {AppConfiguration} appConfiguration The app configuration object
     * @param  {ConfManager} confManager    The conf manager
     * @param  {EventEmitter} eventBus    The global event bus
     * @returns {BackupManager}                       The instance
     */
    constructor(appConfiguration, confManager, eventBus) {
        this.appConfiguration = appConfiguration;
        this.confManager = confManager;
        this.eventBus = eventBus;
    }

    /**
     * Format file entry
     *
     * @param  {string} source      File source entire path
     * @param  {string} destination File destination path
     * @param  {string} file        File name with local path
     * @param  {number} dataType    Data type
     * @returns {Object}             A file entry object
     */
    formatFileEntry(source, destination, file, dataType) {
        const fileStats = fs.statSync(source);
        const md5 = md5File.sync(source);
        return {source: source, destination: destination, file:file, dataType: dataType, stats: fileStats, md5: md5};
    }

    /**
     * Start a backup
     *
     * @param  {Function} cb                  A callback as `(err, backupFilePath) => {}`
     * @param  {boolean}  [saveConfig=true]   Configuration should be saved
     * @param  {boolean}  [saveDb=true]       Dabatabase should be saved
     * @param  {boolean}  [saveCameras=false] Cameras should be saved
     */
    backup(cb, saveConfig = true, saveDb = true, saveCameras = false) {
        const backupDirPath = this.appConfiguration.cachePath + DateUtils.class.timestamp() + "/";
        const backupFilePath = this.appConfiguration.cachePath + DateUtils.class.timestamp() + ".zip";
        const backupFiles = [];
        if (!fs.existsSync(backupDirPath)){
            Logger.info("Create backup dir " + backupDirPath);
            fs.mkdirSync(backupDirPath);
        }

        // Config
        if (saveConfig) {
            const files = fs.readdirSync(this.appConfiguration.configurationPath);
            files.forEach((file) => {
                if (path.extname(file) && path.extname(file) === ConfManager.CONF_FILE_EXTENSION) {
                    backupFiles.push(this.formatFileEntry(this.appConfiguration.configurationPath + file, backupDirPath + file, file, DATA_TYPE_CONF));
                }
            });
        }

        // Database
        if (saveDb) {
            if (fs.existsSync(this.appConfiguration.db)) {
                backupFiles.push(this.formatFileEntry(this.appConfiguration.db, backupDirPath + path.basename(this.appConfiguration.db), path.basename(this.appConfiguration.db), DATA_TYPE_DB));
            } else {
                Logger.warn("No database file to backup");
            }
        }

        // Cameras
        if (saveCameras) {
            const files = fsReadDirRecursive(this.appConfiguration.cameras.archiveFolder);
            files.forEach((file) => {
                fs.ensureDirSync(backupDirPath + path.dirname(file));
                backupFiles.push(this.formatFileEntry(this.appConfiguration.cameras.archiveFolder + file, backupDirPath + file, file, DATA_TYPE_CAMERA));
            });
        }

        let originalSize = 0;
        let descriptor = [];
        backupFiles.forEach((backupFile) => {
            originalSize += backupFile.stats.size;
            descriptor.push({file: backupFile.file, dataType:backupFile.dataType, md5: backupFile.md5});
        });

        Logger.info(backupFiles.length + " files to backup for " + (Math.round((originalSize / 1000000) * 100) / 100) + " Mb");
        this.copyFiles(backupFiles, (err) => {
            if (!err) {
                Logger.info("Writing file descriptor");
                fs.writeFileSync(backupDirPath + DESCRIPTOR, JSON.stringify(descriptor));
                Logger.info("File descriptor written");
                zipdir(backupDirPath, { saveTo: backupFilePath }, (err) => {
                    Logger.info("Zip file created");
                    const backupFileStats = fs.statSync(backupFilePath);
                    const backupSize = backupFileStats.size;
                    Logger.info("Backup size : " + (Math.round((backupSize / 1000000) * 100) / 100) + " Mb");
                    Logger.info("Compression rate : " + (100 - (Math.round((backupSize / originalSize) * 100))) + "%");
                    this.clean(backupDirPath);
                    if (cb) {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, backupFilePath);
                        }
                    }
                });
            } else {
                if (cb) {
                    this.clean(backupDirPath);
                    cb(err);
                }
            }
        });
    }

    /**
     * Clean a backup folder
     *
     * @param  {string} backupFolder A backup folder
     */
    clean(backupFolder) {
        Logger.info("Deleting folder " + backupFolder);
        if (backupFolder.indexOf(this.appConfiguration.cachePath) > -1) {
            fs.removeSync(backupFolder);
        }
    }

    /**
     * Copy files to backup directory
     *
     * @param  {[Object]}   files A list of file entries
     * @param  {Function} cb    A callback `(err) => {}``
     */
    copyFiles(files, cb) {
        const promises = [];
        files.forEach((file) => {
            promises.push(fs.copyFile(file.source, file.destination));
        });

        Logger.info("Copying files ...");
        Promise.all(promises).then(() => {
            Logger.info("Files copied");
            cb(null);
        }).catch((e) => {
            Logger.err(e.message);
            cb(e);
        });
    }

    /**
     * Clean filepath, to avoid inserting bad characters and deleting critical files
     *
     * @param  {string} filePath File path
     * @returns {string}          A sanitized file path
     */
    sanitize(filePath) {
        return filePath.split("../").join("");
    }

    /**
     * Restore a backup local file
     *
     * @param  {string}   backupFilePath A backup zip local file
     * @param  {Function} cb             A callback `(err) => {}`
     */
    restore(backupFilePath, cb) {
        const backupDirPath = this.appConfiguration.cachePath + DateUtils.class.timestamp() + "/";
        if (!fs.existsSync(backupDirPath)){
            Logger.info("Create extract backup dir " + backupDirPath);
            fs.mkdirSync(backupDirPath);
        }

        // Check backup
        if (fs.existsSync(backupFilePath)) {
            extractzip(backupFilePath, {dir: backupDirPath}, (err) => {
                if (!err) {
                    // Check file descriptor
                    if (fs.existsSync(backupDirPath + DESCRIPTOR)) {
                        if (cb) {
                            // Read descriptor
                            const descriptor = JSON.parse(fs.readFileSync(backupDirPath + DESCRIPTOR));

                            Logger.info("Cleaning unsaved configuration files");
                            Logger.warn("The following files will not be saved : " + JSON.stringify(Object.keys(this.confManager.toBeSaved)));
                            this.confManager.writeDataToDisk();
                            let fileRestored = 0;
                            Logger.info("Restoring " + descriptor.length + " files ...");
                            descriptor.forEach((descriptorFile) => {
                                // Check validity
                                if (md5File.sync(backupDirPath + descriptorFile.file) === descriptorFile.md5) {
                                    // Restore conf
                                    if (descriptorFile.dataType === DATA_TYPE_CONF) {
                                        fs.removeSync(this.sanitize(this.appConfiguration.configurationPath + descriptorFile.file));
                                        fs.copySync(this.sanitize(backupDirPath + descriptorFile.file), this.sanitize(this.appConfiguration.configurationPath + descriptorFile.file));
                                        fileRestored++;
                                    }

                                    // Restore DB
                                    if (descriptorFile.dataType === DATA_TYPE_DB) {
                                        fs.removeSync(this.appConfiguration.db);
                                        fs.copySync(this.sanitize(backupDirPath + descriptorFile.file), this.appConfiguration.db);
                                        fileRestored++;
                                    }

                                    // Restore camera
                                    if (descriptorFile.dataType === DATA_TYPE_CAMERA) {
                                        fs.removeSync(this.sanitize(this.appConfiguration.cameras.archiveFolder + descriptorFile.file));
                                        fs.copySync(this.sanitize(backupDirPath + descriptorFile.file), this.sanitize(this.appConfiguration.cameras.archiveFolder + descriptorFile.file));
                                        fileRestored++;
                                    }
                                } else {
                                    Logger.warn("Invalid checksum for file " + descriptorFile.file);
                                }
                            });

                            Logger.info("Files restored : " + fileRestored + " / " + descriptor.length);
                            Logger.info("Restarting system in " + RESTART_TIMER + " seconds ...");
                            setTimeout((self) => {
                                self.eventBus.emit(HautomationRunnerConstants.RESTART);
                            }, RESTART_TIMER * 1000, this);

                            cb();
                        }
                    } else {
                        this.clean(backupDirPath);
                        if (cb) {
                            cb(Error("Missing descriptor file. Can't restore"));
                        }
                    }
                } else {
                    this.clean(backupDirPath);
                    if (cb) {
                        cb(err);
                    }
                }
            });
        } else {
            if (cb) {
                cb(Error("Unexisting backup file. Can't restore"));
            }
        }
    }
}

module.exports = {class:BackupManager};
