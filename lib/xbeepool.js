var util = require('util');
var EventEmitter = require('events');
var XBee = require('./xbee.js')

function XBeePoolManager() {
  EventEmitter.call(this);
  this.openConnections = {};
}
util.inherits(XBeePoolManager, EventEmitter);

XBeePoolManager.prototype.get = function (nodeId, config) {
  var me = this;
  var xBee = this.openConnections[config.id];
  if (!xBee) {
    xBee = new XBee(config);
    this.openConnections[config.id] = xBee;
    this.emit('xbee' + nodeId, xBee);
  } else {
    setTimeout(function () {
      me.emit('xbee' + nodeId, xBee);
    }, 5000);
  }
}

XBeePoolManager.prototype.cleanUp = function (cb) {
  var xBeeKeys = Object.keys(this.openConnections);
  var me = this;

  if (xBeeKeys.length > 0) {
    var xBee = this.openConnections[xBeeKeys[0]];
    delete this.openConnections[xBeeKeys[0]];

    xBee.close(function (err) {
      me.cleanUp(cb);
    });

  } else {
    // Calling callback from node 'close' event
    cb();
  }
}

module.exports = XBeePoolManager;
