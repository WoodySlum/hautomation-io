/* eslint-disable */
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-hautomation-temperature", "Hautomation temperature sensor", HautomationTemperatureAccessory);
}

function HautomationTemperatureAccessory(log, config) {
  this.log = log;

  this.service = new Service.TemperatureSensor(this.name);

  this.coreApi = config.coreApi;
  this.identifier = config.identifier;
  this.name = config.name;

  this.service
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', this.getTemperature.bind(this))
    .setProps({ minValue: -50 , maxValue: 50});
}

HautomationTemperatureAccessory.prototype.getTemperature = function(callback) {
    this.coreApi.sensorAPI.getValue(this.identifier, (err, res) => {
        if (!err && res) {
            callback(null, parseFloat(res.value));
        } else {
            callback(Error("Invalid value"));
        }
    });
}


HautomationTemperatureAccessory.prototype.getServices = function() {
  return [this.service];
}
