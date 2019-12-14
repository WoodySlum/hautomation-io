"use strict";
const PrivateProperties = require("./../PrivateProperties");

/**
 * Public API for backup
 * @class
 */
class BackupAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {BackupManager} backupManager The backup manager instance
    //  * @returns {BackupAPI}             The instance
    //  */
    constructor(backupManager) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).backupManager = backupManager;
    }
    /* eslint-enable */

    /**
     * Get alarm state
     *
     * @returns {boolean} True if alarm is enabled, false otherwise
     */
    alarmStatus() {
        return PrivateProperties.oprivate(this).alarmManager.alarmStatus();
    }

    /**
     * Start a backup
     *
     * @param  {Function} cb                  A callback as `(err, backupFilePath) => {}`
     * @param  {boolean}  [saveConfig=true]   Configuration should be saved
     * @param  {boolean}  [saveDb=true]       Dabatabase should be saved
     * @param  {boolean}  [saveCameraHistory=false] Cameras historyshould be saved
     */
    backup(cb, saveConfig = true, saveDb = true, saveCameraHistory = false) {
        PrivateProperties.oprivate(this).backupManager.backup(cb, saveConfig, saveDb, saveCameraHistory);
    }

    /**
     * Restore a backup local file
     *
     * @param  {string}   backupFilePath A backup zip local file
     * @param  {Function} cb             A callback `(err) => {}`
     */
    restore(backupFilePath, cb) {
        PrivateProperties.oprivate(this).backupManager.restore(backupFilePath, cb);
    }

    /**
     * Clean a backup file
     *
     * @param  {string} backupFilePath Backup file path
     */
    cleanBackupFile(backupFilePath) {
        PrivateProperties.oprivate(this).backupManager.cleanBackupFile(backupFilePath);
    }

    /**
     * Add a backup folder
     *
     * @param  {string} path      A folder path
     */
    addBackupFolder(path) {
        PrivateProperties.oprivate(this).backupManager.addBackupFolder(path);
    }

    /**
     * Add a backup file path
     *
     * @param  {string} path      A file path
     */
    addBackupFile(path) {
        PrivateProperties.oprivate(this).backupManager.addBackupFile(path);
    }
}

module.exports = {class:BackupAPI};
