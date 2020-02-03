/* eslint-disable */
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-smarties-humidity", "Smarties humidity sensor", SmartiesHumidityAccessory);
}

function SmartiesHumidityAccessory(log, config) {
  this.log = log;

  this.service = new Service.HumiditySensor(this.name);

  this.coreApi = config.coreApi;
  this.identifier = config.identifier;
  this.name = config.name;

  this.service
    .getCharacteristic(Characteristic.CurrentRelativeHumidity)
    .on('get', this.getHumidity.bind(this))
    .setProps({ minValue: 0 , maxValue: 100});
}

SmartiesHumidityAccessory.prototype.getHumidity = function(callback) {
    this.coreApi.sensorAPI.getValue(this.identifier, (err, res) => {
        if (!err && res) {
            callback(null, parseFloat(res.value));
        } else {
            callback(Error("Invalid value"));
        }
    });
}


SmartiesHumidityAccessory.prototype.getServices = function() {
  return [this.service];
}
