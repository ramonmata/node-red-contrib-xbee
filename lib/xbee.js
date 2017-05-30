var util = require('util');
var EventEmitter = require('events');
var SerialPort = require('serialport');
var xbee_api = require('xbee-api');
var C = xbee_api.constants;

// XBee constructor
function XBee(config) {
  EventEmitter.call(this);
  this.config = config;
  this.isOpen = false;
  this.isListening = false;
  this.serialConnection;
}
// Inherits EventEmitter functionality
util.inherits(XBee, EventEmitter);

XBee.prototype.open = function (cb) {
  var me = this;
  // safe check if it is already open
  if (this.isOpen) return;

  this.xbeeAPI = new xbee_api.XBeeAPI({
    api_mode: parseInt(me.config.apiMode)
  });

  this.serialConnection = new SerialPort(me.config.serialPort, {
    baudrate: parseInt(me.config.baudRate),
    parser: me.xbeeAPI.rawParser(),
    autoOpen: false
  });

  this.serialConnection.open(function (err) {
    if (cb) {
      if (err) {
        cb(err);
      } else {
        me.isOpen = true;
        cb();
      }
    } else {
      me.isOpen = true;
      me.emit('open' + me.config.id, err);
    }
  });
}

XBee.prototype.close = function (cb) {
  var me = this;
  me.xbeeAPI.removeAllListeners('frame_object');
  me.removeAllListeners('open' + me.config.id);
  me.removeAllListeners('data' + me.config.id);
  if (this.isOpen) {
    me.serialConnection.close(function () {
      me.isOpen = false;
      cb();
    });
  }
}

XBee.prototype.listen = function () {
  var me = this;
  if (this.xbeeAPI && !this.isListening) {
    me.isListening = true;
    me.xbeeAPI.on("frame_object", function (frame) {
      me.emit('data' + me.config.id, frame);
    }).on('error', function(err){
      me.emit('error' + me.config.id, err);
    });
  }
}

XBee.prototype.transmit = function (data) {
  if (this.isOpen) {
    this.serialConnection.write(data);
  }
}

module.exports = XBee;
