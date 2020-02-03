"use strict";
const PrivateProperties = require("./../PrivateProperties");

/**
 * Public API for installation of external apps
 * @class
 */
class InstallerAPI {
    /* eslint-disable */
    // /**
    //  * Constructor
    //  *
    //  * @param  {InstallationManager} installationManager The installation manager instance
    //  * @param  {string} version The plugin version
    //  * @returns {InstallerAPI}             The instance
    //  */
    constructor(installationManager, version) {
        PrivateProperties.createPrivateState(this);
        PrivateProperties.oprivate(this).installationManager = installationManager;
        PrivateProperties.oprivate(this).version = version;
    }
    /* eslint-enable */

    /**
     * Register a command to be executed for a specific version
     *
     * @param  {string|Array}  [arch="*"]     The architecture ('arm', 'arm64', 'ia32', 'mips', 'mipsel', 'ppc', 'ppc64', 's390', 's390x', 'x32', 'x64', and 'x86'). Can be `*` for all arch, or an array of architectures
     * @param  {string}  command        A command
     * @param  {boolean} [sudo=false]    True if command should be executed as sudo, false otherwise. The Smarties process owner user should be in `sudo` group without password.
     * @param  {boolean} [wait=true]    True if command is executed synchronously, false otherwise
     * @param  {boolean} [skipError=false]    True if command fails should continue, false for retrying
     */
    register(arch = "*", command, sudo = false, wait = true, skipError = false) {
        PrivateProperties.oprivate(this).installationManager.register(PrivateProperties.oprivate(this).version, arch, command, sudo, wait, skipError);
    }

    /**
     * Execute a command. Can throw an error if wait is `true`
     *
     * @param  {string}  command     The command
     * @param  {boolean} [wait=true] True if command is executed synchronously, false otherwise
     * @param  {Function}  [cb=null]   A callback (only if wait parameter is false) : `(error, stdout, stderr) => {}`
     * @returns {Object}              An object result if wait is `true`
     */
    executeCommand(command, wait = true, cb = null) {
        PrivateProperties.oprivate(this).installationManager.executeCommand(command, wait, cb);
    }
}

module.exports = {class:InstallerAPI};
