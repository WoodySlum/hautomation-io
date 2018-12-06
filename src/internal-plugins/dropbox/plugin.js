"use strict";
const fetch = require("isomorphic-fetch");
const DropboxApi = require("dropbox").Dropbox;
const fs = require("fs-extra");
const BACKUP_FILE_NAME = "hautomation-backup.zip";
const TIME_EVENT_KEY = "dropbox-backup";

/**
 * Loaded plugin function
 *
 * @param  {PluginAPI} api The core APIs
 */
function loaded(api) {
    api.init();

    /**
     * This class manage Dropbox form configuration
     * @class
     */
    class DropboxForm extends api.exported.FormObject.class {
        /**
         * Constructor
         *
         * @param  {number} id The identifier
         * @param  {string} accessToken Dropbox access token
         * @param  {number} manualAction Manual actions
         * @param  {boolean} confirmRestore Confirm restore
         * @param  {boolean} saveConfiguration Save conf files
         * @param  {boolean} saveDatabase Save database file
         * @param  {boolean} saveCameraHistory Save camera history
         * @param  {number} autoBackup Automatic backup
         * @returns {DropboxForm}        The instance
         */
        constructor(id, accessToken, manualAction, confirmRestore, saveConfiguration, saveDatabase, saveCameraHistory, autoBackup) {
            super(id);

            /**
             * @Property("accessToken");
             * @Type("string");
             * @Title("dropbox.access.token");
             */
            this.accessToken = accessToken;

            /**
             * @Property("saveConfiguration");
             * @Type("boolean");
             * @Title("dropbox.save.configuration");
             * @Default(true);
             */
            this.saveConfiguration = saveConfiguration;

            /**
             * @Property("saveDatabase");
             * @Type("boolean");
             * @Title("dropbox.save.database");
             * @Default(true);
             */
            this.saveDatabase = saveDatabase;

            /**
             * @Property("saveCameraHistory");
             * @Type("boolean");
             * @Title("dropbox.save.camera.history");
             * @Default(false);
             */
            this.saveCameraHistory = saveCameraHistory;

            /**
             * @Property("autoBackup");
             * @Type("number");
             * @Title("dropbox.auto.backup");
             * @Enum([0, 1, 2, 3]);
             * @EnumNames(["dropbox.auto.backup.none", "dropbox.auto.backup.every.day", "dropbox.auto.backup.every.week", "dropbox.auto.backup.every.month"]);
             * @Default(0);
             * @Display("radio");
             */
            this.autoBackup = autoBackup;

            /**
             * @Property("manualAction");
             * @Type("number");
             * @Title("dropbox.manual.actions");
             * @Enum([0, 1, 2]);
             * @EnumNames(["dropbox.manual.actions.none", "dropbox.manual.actions.backup", "dropbox.manual.actions.restore"]);
             * @Default(0);
             * @Display("radio");
             */
            this.manualAction = manualAction;

            /**
             * @Property("confirmRestore");
             * @Type("boolean");
             * @Title("dropbox.restore.confirm");
             * @Default(false);
             */
            this.confirmRestore = confirmRestore;

        }


        /**
         * Convert a json object to DropboxForm object
         *
         * @param  {Object} data Some data
         * @returns {DropboxForm}      An instance
         */
        json(data) {
            return new DropboxForm(data.id, data.accessToken, data.manualAction, data.confirmRestore, data.saveConfiguration, data.saveDatabase, data.saveCameraHistory, data.autoBackup);
        }
    }

    // Register the dropbox form
    api.configurationAPI.register(DropboxForm);

    /**
     * This class manage Dropbox backups
     * @class
     */
    class Dropbox {
        /**
         * Constructor
         *
         * @param  {PluginAPI} api The core APIs
         * @returns {Dropbox}        The instance
         */
        constructor(api) {
            this.api = api;

            const self = this;

            api.configurationAPI.setUpdateCb((data) => {
                if (data.manualAction === 1) {
                    self.backup(data, self);
                } else if (data.manualAction === 2 && data.confirmRestore) {
                    self.restore(self);
                }

                data.manualAction = 0;
                data.confirmRestore = false;
                api.configurationAPI.saveData(data);

                self.autoBackup(data, self);
            });

            this.autoBackup(api.configurationAPI.getConfiguration(), this);
        }

        /**
         * Automatic backup
         *
         * @param  {Object} data    Form configuration data
         * @param  {Dropbox} context The context. If null, set to this
         */
        autoBackup(data, context) {
            if (!context) {
                context = this;
            }

            context.api.timeEventAPI.unregister(null, null, null, null, null, TIME_EVENT_KEY);

            if (data && data.autoBackup && data.autoBackup > 0) {
                context.api.timeEventAPI.register((self) => {
                    const date = new Date();
                    const day = date.getDate();
                    const weekDay = date.getDay();

                    // Every day
                    if (self.api.configurationAPI.getConfiguration().autoBackup === 1) {
                        self.backup(data, self);
                    } else if (self.api.configurationAPI.getConfiguration().autoBackup === 2) {
                        // Every week monday at 5 am
                        if (weekDay === 0) {
                            self.backup(data, self);
                        }
                    } else if (self.api.configurationAPI.getConfiguration().autoBackup === 3) {
                        // Every month 1st
                        if (day === 1) {
                            self.backup(data, self);
                        }
                    }
                }, context, context.api.timeEventAPI.constants().EVERY_DAYS, null, null, null, TIME_EVENT_KEY);
            }
        }

        /**
         * Backup to dropbox
         *
         * @param  {Object} data    Form configuration data
         * @param  {Dropbox} context The context. If null, set to this
         */
        backup(data, context = null) {
            if (!context) {
                context = this;
            }

            if (data.accessToken) {
                context.api.backupAPI.backup((err, backupFilePath) => {
                    if (err) {
                        context.api.exported.Logger.err(err.message);
                    } else {
                        const dbx = new DropboxApi({accessToken: data.accessToken, fetch: fetch});
                        dbx.filesDelete({ path: "/" + BACKUP_FILE_NAME })
                        .then((response) => {
                            context.api.exported.Logger.info(response);
                            context.uploadDropbox(context, dbx, backupFilePath, BACKUP_FILE_NAME);
                        })
                        .catch((err) => {
                            // File not found
                            if (err.response.status === 409) {
                                context.uploadDropbox(context, dbx, backupFilePath, BACKUP_FILE_NAME);
                            } else {
                                context.api.exported.Logger.err(err);
                            }
                        });
                    }
                }, data.saveConfiguration, data.saveDatabase, data.saveCameraHistory);
            } else {
                context.api.exported.Logger.err("Missing dropbox access token");
            }
        }

        /**
         * Upload file to dropbox
         *
         * @param  {Dropbox} context The context. If null, set to this
         * @param  {DropboxApi} dbx            A dropbox api instance
         * @param  {string} backupFilePath Backup file path
         * @param  {string} fileName       Dropbox destination file name
         */
        uploadDropbox(context, dbx, backupFilePath, fileName) {
            if (!context) {
                context = this;
            }

            fs.readFile(backupFilePath, (err, contents) => {
                if (err) {
                    context.api.exported.Logger.err(err.message);
                } else {
                    dbx.filesUpload({path: "/" + fileName, contents: contents})
                    .then((response) => {
                        context.api.exported.Logger.verbose(response);
                        context.api.exported.Logger.info("Dropbox backup uploaded successfully");
                        try {
                            context.api.backupAPI.cleanBackupFile(backupFilePath);
                        } catch(e) {
                            context.api.exported.Logger.err(e.message);
                        }
                    })
                    .catch((err) => {
                        context.api.exported.Logger.err("Dropbox backup uploaded failed");
                        context.api.exported.Logger.err(err);
                    });
                }
            });
        }

        /**
         * Restore file from dropbox
         *
         * @param  {Dropbox} context The context. If null, set to this
         */
        restore(context) {
            const accessToken = context.api.configurationAPI.getConfiguration().accessToken;
            if (accessToken) {
                const dbx = new DropboxApi({accessToken: accessToken, fetch: fetch});
                dbx.filesAlphaGetMetadata({ path: "/" + BACKUP_FILE_NAME })
                .then(() => {
                    context.api.exported.Logger.info("Downloading backup ...");
                    dbx.filesDownload({ path: "/" + BACKUP_FILE_NAME })
                    .then(function (data) {
                        const backupFilePath = api.exported.cachePath + "backup-" + api.exported.DateUtils.class.timestamp() + ".zip";
                        fs.writeFile(backupFilePath, data.fileBinary, "binary", function (err) {
                            if (err) {
                                context.api.exported.Logger.err(err);
                            } else {
                                context.api.exported.Logger.info("Backup downloaded, now restoring ...");
                                context.api.backupAPI.restore(backupFilePath, (err) => {
                                    if (err) {
                                        context.api.exported.Logger.err(err.message);
                                    }

                                    fs.removeSync(backupFilePath);
                                });
                            }
                        });
                    })
                    .catch(function (err) {
                        throw err;
                    });
                })
                .catch(() => {
                    context.api.exported.Logger.err("Probably backup file does not exists ...");
                });
            } else {
                context.api.exported.Logger.err("Missing dropbox access token");
            }
        }
    }

    new Dropbox(api);
}

module.exports.attributes = {
    loadedCallback: loaded,
    name: "dropbox",
    version: "0.0.0",
    category: "backup",
    description: "Dropbox backup support",
    dependencies:[]
};
