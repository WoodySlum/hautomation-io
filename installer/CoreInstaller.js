"use strict";
// Install dependencies
module.exports = {install:(installationManager) => {
    // Mac OS X
    installationManager.register("0.0.3", ["x32", "x64"], "brew install imagemagick", false, true, true);
    installationManager.register("0.0.3", ["x32", "x64"], "brew install graphicsmagick", false, true, true);
    installationManager.register("0.0.3", ["x32", "x64"], "brew install libav", false, true, true);
    installationManager.register("0.0.3", ["x32", "x64"], "pip install -U platformio", false, true, true);
    installationManager.register("0.0.3", ["x32", "x64"], "pio platform install https://github.com/platformio/platform-espressif8266.git#feature/stage", false, true, true);
    installationManager.register("0.0.3", ["x32", "x64"], "brew install portaudio sox mplayer", false, true, true);

    // Raspberry Pi
    installationManager.register("0.0.3", ["arm", "arm64", "docker"], "apt-get update", true, true);
    installationManager.register("0.0.3", ["arm", "arm64", "docker"], "apt-get install -y --allow-unauthenticated imagemagick graphicsmagick", true, true);
    installationManager.register("0.0.3", ["arm", "arm64", "docker"], "apt-get install -y --allow-unauthenticated libav-tools", true, true);
    installationManager.register("0.0.3", ["arm", "arm64", "docker"], "apt-get install -y --allow-unauthenticated git python-pip python3-pip && pip install -U platformio", true, true);
    installationManager.register("0.0.3", ["arm", "arm64", "docker"], "pio platform install https://github.com/platformio/platform-espressif8266.git#feature/stage", true, true);
    installationManager.register("0.0.3", ["arm", "arm64", "docker"], "apt-get install -y --allow-unauthenticated libudev-dev", true, true); // Usb port detection
    installationManager.register("0.0.3", ["arm", "arm64", "docker"], "apt-get update", true, true);
    installationManager.register("0.0.3", ["arm", "arm64", "docker"], "apt-get install -y --allow-unauthenticated alsa-utils libasound2-dev python-pyaudio python3-pyaudio sox", true, true); // Bot engine
    installationManager.register("0.0.3", ["arm", "arm64", "docker"], "apt-get install -y --allow-unauthenticated mplayer festival festvox-kallpc16k", true, true); // Bot engine
    installationManager.register("0.0.50", ["arm", "arm64", "docker"], "apt-get install -y --allow-unauthenticated at", true, true); // Auto updater

    // Global
    installationManager.register("0.0.3", "*", "pip install pyaudio", true, true);

}};
