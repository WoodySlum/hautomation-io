"use strict";
// Install dependencies
module.exports = {install:(installationManager) => {
    // Image tools
    // -----------
    // Mac OS X
    installationManager.register("0.0.3", ["x32", "x64"], "brew install imagemagick", false, false, true);
    installationManager.register("0.0.3", ["x32", "x64"], "brew install graphicsmagick", false, false, true);

    // Raspberry Pi
    installationManager.register("0.0.3", ["arm", "arm64"], "apt-get update", true, true);
    installationManager.register("0.0.3", ["arm", "arm64"], "apt-get install -y imagemagick graphicsmagick", true, true);

    // Voice recognition
    // -----------------
    // Mac OS X
    installationManager.register("0.0.3", ["x32", "x64"], "brew install portaudio sox mplayer", false, true, true);

    // Raspberry Pi
    installationManager.register("0.0.3", ["arm", "arm64"], "apt-get update", true, true);
    installationManager.register("0.0.3", ["arm", "arm64"], "apt-get install -y libasound2-dev python-pyaudio python3-pyaudio sox", true, true);

    // Global
    installationManager.register("0.0.3", "*", "pip install pyaudio", true, true);

}};
