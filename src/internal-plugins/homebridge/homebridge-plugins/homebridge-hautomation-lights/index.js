/* eslint-disable */
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-hautomation-lights", "Hautomation lights", HautomationAccessory);
}

function HautomationAccessory(log, config) {
  this.log = log;

  this.service = new Service.Lightbulb(this.name);
  this.coreApi = config.coreApi;
  this.identifier = config.identifier;
  this.status = config.status;
  this.name = config.name;

  this.service
    .getCharacteristic(Characteristic.On)
    .on('get', this.getState.bind(this))
    .on('set', this.setState.bind(this));
}

HautomationAccessory.prototype.getState = function(callback) {
    callback(null, this.coreApi.deviceAPI.getDeviceStatus(this.identifier));
}

HautomationAccessory.prototype.setState = function(state, callback) {
    let status = this.coreApi.deviceAPI.constants().STATUS_OFF;
    if (state) {
        status = this.coreApi.deviceAPI.constants().STATUS_ON;
    }

    this.coreApi.deviceAPI.switchDevice(this.identifier, status);
    this.status = state;
    callback(null); // success
}

HautomationAccessory.prototype.getServices = function() {
  return [this.service];
}
