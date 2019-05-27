/* eslint-disable */
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-hautomation-alarm", "Hautomation alarm", HautomationAccessory);
}

function HautomationAccessory(log, config) {
  this.log = log;

  this.service = new Service.Lightbulb(this.name);
  this.coreApi = config.coreApi;
  this.name = config.name;

  this.service
    .getCharacteristic(Characteristic.On)
    .on('get', this.getState.bind(this))
    .on('set', this.setState.bind(this))
}

HautomationAccessory.prototype.getState = function(callback) {
    callback(null, this.coreApi.alarmAPI.alarmStatus());
}

HautomationAccessory.prototype.setState = function(state, callback) {
    if (state) {
        this.coreApi.alarmAPI.enableAlarm();
    } else {
        this.coreApi.alarmAPI.disableAlarm();
    }

    callback(null); // success
}

HautomationAccessory.prototype.getServices = function() {
  return [this.service];
}
