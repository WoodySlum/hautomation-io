/* eslint-disable */
var Service, Characteristic;
const colorutil = require("color-util");

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-smarties-lights", "Smarties lights", SmartiesAccessory);
}

function SmartiesAccessory(log, config) {
  this.log = log;

  this.service = new Service.Lightbulb(this.name);
  this.coreApi = config.coreApi;
  this.identifier = config.identifier;
  this.status = config.status;
  this.name = config.name;
  this.device = config.device;

  this.service
    .getCharacteristic(Characteristic.On)
    .on('get', this.getState.bind(this))
    .on('set', this.setState.bind(this))
  const deviceTypes = this.coreApi.deviceAPI.getDeviceTypes(this.device);

  if (deviceTypes.indexOf(this.coreApi.deviceAPI.constants().DEVICE_TYPE_LIGHT_DIMMABLE) >= 0 || deviceTypes.indexOf(this.coreApi.deviceAPI.constants().DEVICE_TYPE_LIGHT_DIMMABLE_COLOR) >= 0) {
      this.service
        .getCharacteristic(Characteristic.Brightness)
        .on('get', this.getBrightness.bind(this))
        .on('set', this.setBrightness.bind(this));
  }

  if (deviceTypes.indexOf(this.coreApi.deviceAPI.constants().DEVICE_TYPE_LIGHT_DIMMABLE_COLOR) >= 0) {
      this.service
        .getCharacteristic(Characteristic.Hue)
        .on('get', this.getHue.bind(this))
        .on('set', this.setHue.bind(this));

        this.service
          .getCharacteristic(Characteristic.Saturation)
          .on('get', this.getSaturation.bind(this))
          .on('set', this.setSaturation.bind(this));
  }
}

SmartiesAccessory.prototype.getState = function(callback) {
    callback(null, this.coreApi.deviceAPI.getDeviceStatus(this.identifier));
}

SmartiesAccessory.prototype.setState = function(state, callback) {
    const device = this.coreApi.deviceAPI.getDeviceById(this.device.id);
    device.status = this.coreApi.deviceAPI.constants().STATUS_OFF;
    if (state) {
        device.status = this.coreApi.deviceAPI.constants().STATUS_ON;
    }

    this.coreApi.deviceAPI.switchDeviceWithDevice(device);
    this.status = state;
    callback(null); // success
}

SmartiesAccessory.prototype.getBrightness = function(callback) {
    const device = this.coreApi.deviceAPI.getDeviceById(this.device.id);
    if (device && device.brightness) {
        callback(null, (device.brightness * 100));
    } else {
        callback(null, 100);
    }
}

SmartiesAccessory.prototype.setBrightness = function(brightness, callback) {
    const device = this.coreApi.deviceAPI.getDeviceById(this.device.id);
    device.brightness = parseFloat(brightness / 100);

    this.coreApi.deviceAPI.switchDeviceWithDevice(device);
    callback(null);
}

SmartiesAccessory.prototype.getHue = function(callback) {
    const device = this.coreApi.deviceAPI.getDeviceById(this.device.id);
    if (device.color) {
        const rgbColor = colorutil.hex.to.rgb("#" + device.color);
        const hsvColor = colorutil.rgb.to.hsv(rgbColor);
        callback(null, parseInt(hsvColor.h * 360));
    } else {
        callback(null);
    }
}

SmartiesAccessory.prototype.setHue = function(hue, callback) {
    const device = this.coreApi.deviceAPI.getDeviceById(this.device.id);
    let rgbColor = colorutil.hex.to.rgb("#" + device.color);
    if (rgbColor) {
        const hsvColor = colorutil.rgb.to.hsv(rgbColor);
        hsvColor.h = parseFloat(hue / 360);
        rgbColor = colorutil.hsv.to.rgb(hsvColor);
        if (rgbColor) {
            device.color = colorutil.rgb.to.hex(rgbColor).replace("#", "");
            this.coreApi.deviceAPI.switchDeviceWithDevice(device);
        }
    }

    callback(null);
}

SmartiesAccessory.prototype.getSaturation = function(callback) {
    const device = this.coreApi.deviceAPI.getDeviceById(this.device.id);
    if (device.color) {
        const rgbColor = colorutil.hex.to.rgb("#" + device.color);
        const hsvColor = colorutil.rgb.to.hsv(rgbColor);
        callback(null, parseInt(hsvColor.s * 100));
    } else {
        callback(null);
    }
}

SmartiesAccessory.prototype.setSaturation = function(sat, callback) {
    const device = this.coreApi.deviceAPI.getDeviceById(this.device.id);
    let rgbColor = colorutil.hex.to.rgb("#" + device.color);
    if (rgbColor) {
        const hsvColor = colorutil.rgb.to.hsv(rgbColor);
        hsvColor.s = parseFloat(sat / 100);
        rgbColor = colorutil.hsv.to.rgb(hsvColor);
        if (rgbColor) {
            device.color = colorutil.rgb.to.hex(rgbColor).replace("#", "");
            this.coreApi.deviceAPI.switchDeviceWithDevice(device);
        }
    }

    callback(null);
}

SmartiesAccessory.prototype.getServices = function() {
  return [this.service];
}
