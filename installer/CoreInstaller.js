"use strict";
// Install dependencies
module.exports = {install:(installationManager) => {
    // Mac OS X
    installationManager.register("0.0.3", ["darwin-x32", "darwin-x64"], "brew install imagemagick", false, true, true);
    installationManager.register("0.0.3", ["darwin-x32", "darwin-x64"], "brew install graphicsmagick", false, true, true);
    installationManager.register("0.0.3", ["darwin-x32", "darwin-x64"], "brew install libav", false, true, true);
    installationManager.register("0.0.3", ["darwin-x32", "darwin-x64"], "pip install -U platformio", false, true, true);
    installationManager.register("0.0.3", ["darwin-x32", "darwin-x64"], "pio platform install https://github.com/platformio/platform-espressif8266.git#feature/stage", false, true, true);
    installationManager.register("0.0.3", ["darwin-x32", "darwin-x64"], "brew install portaudio sox mplayer", false, true, true);

    // Raspberry Pi
    installationManager.register("0.0.3", ["linux-arm", "linux-arm64", "linux-x32", "linux-x64", "docker"], "apt-get update", true, true);
    installationManager.register("0.0.3", ["linux-arm", "linux-arm64", "linux-x32", "linux-x64", "docker"], "apt-get install -y --allow-unauthenticated imagemagick graphicsmagick", true, true);
    installationManager.register("0.0.3", ["linux-arm", "linux-arm64", "linux-x32", "linux-x64", "docker"], "apt-get install -y --allow-unauthenticated ffmpeg", true, true);
    installationManager.register("0.0.3", ["linux-arm", "linux-arm64", "linux-x32", "linux-x64", "docker"], "apt-get install -y --allow-unauthenticated git python-pip python3-pip && pip install -U platformio", true, true);
    installationManager.register("0.0.3", ["linux-arm", "linux-arm64", "linux-x32", "linux-x64", "docker"], "pio platform install https://github.com/platformio/platform-espressif8266.git#feature/stage", true, true);
    installationManager.register("0.0.3", ["linux-arm", "linux-arm64", "linux-x32", "linux-x64", "docker"], "apt-get install -y --allow-unauthenticated libudev-dev", true, true); // Usb port detection
    installationManager.register("0.0.3", ["linux-arm", "linux-arm64", "linux-x32", "linux-x64", "docker"], "apt-get update", true, true);
    installationManager.register("0.0.3", ["linux-arm", "linux-arm64", "linux-x32", "linux-x64", "docker"], "apt-get install -y --allow-unauthenticated alsa-utils libasound2-dev python-pyaudio python3-pyaudio sox", true, true); // Bot engine
    installationManager.register("0.0.3", ["linux-arm", "linux-arm64", "linux-x32", "linux-x64", "docker"], "apt-get install -y --allow-unauthenticated mplayer festival festvox-kallpc16k", true, true); // Bot engine
    installationManager.register("0.0.50", ["linux-arm", "linux-arm64", "linux-x32", "linux-x64", "docker"], "apt-get install -y --allow-unauthenticated at", true, true); // Auto updater
    installationManager.register("0.1.0", ["linux-arm", "linux-arm64", "linux-x32", "linux-x64", "docker"], "apt-get install -y --allow-unauthenticated arp-scan", true, true); // Arp ip pscan

    // Global
    installationManager.register("0.0.3", "*", "pip install pyaudio", true, true);

}};
