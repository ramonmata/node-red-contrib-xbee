var util = require('util');
var EventEmitter = require('events');
var SerialPort = require('serialport');
var xbee_api = require('xbee-api');

// XBee constructor
function XBee(config) {
  EventEmitter.call(this);

  this.config = config;
  this.isListening = false;
  this._initXBeeAPI();
  this._initSerial();
}

util.inherits(XBee, EventEmitter);

XBee.prototype.init = function () {
  var me = this;

  if (me.serialConnection.isOpen()) {
    me.emit('open' + me.config.id);
  } else {
    me.serialConnection.open(function (err) {
      if (err) {
        me.emit('error' + me.config.id, err);
      } else {
        me.emit('open' + me.config.id);
      }
    });
  }
};

XBee.prototype._initXBeeAPI = function () {
  this.xbeeAPI = new xbee_api.XBeeAPI({
    api_mode: this.config.apiMode,
    raw_frames: this.config.rawFrames,
    convert_adc: this.config.convertAdc,
    vref_adc: this.config.vrefAdc
  });
};

XBee.prototype._initSerial = function () {
  var me = this;
  this.serialConnection = new SerialPort(this.config.serialPort, {
    autoOpen: false,
    lock: this.config.lock,
    baudrate: this.config.baudRate,
    dataBits: this.config.dataBits,
    stopBits: this.config.stopBits,
    parity: this.config.parity,
    rtscts: this.config.rtscts,
    xon: this.config.xon,
    xoff: this.config.xoff,
    xany: this.config.xany,
    bufferSize: this.config.bufferSize,
    parser: this.xbeeAPI.rawParser(),
    platformOptions: {
      vmin: this.config.vmin,
      vtime: this.config.vtime
    }
  });
  this.serialConnection.on('disconnect', function () {
    me.emit('disconnect' + me.config.id);
  });
};

XBee.prototype.close = function (cb) {
  var me = this;
  me.xbeeAPI.removeAllListeners('frame_object');
  me.removeAllListeners('open' + me.config.id);
  me.removeAllListeners('data' + me.config.id);
  me.removeAllListeners('sent' + me.config.id);
  me.removeAllListeners('error' + me.config.id);
  me.removeAllListeners('disconnect' + me.config.id);
  if (me.serialConnection.isOpen()) {
    me.serialConnection.close(cb);
  }
};

XBee.prototype.listen = function () {
  var me = this;
  if (!me.isListening) {
    me.isListening = true;
    me.xbeeAPI.on('frame_object', function (frame) {
      me.emit('data' + me.config.id, frame);
    }).on('error', function (err) {
      me.emit('error' + me.config.id, err);
    });
  }
};

XBee.prototype.transmit = function (data) {
  var me = this;
  if (me.serialConnection.isOpen()) {
    me.serialConnection.write(
      me.xbeeAPI.buildFrame(data)
    );
    me.emit('sent' + me.config.id);
  }
};

module.exports = XBee;
