var util = require('util');
var EventEmitter = require('events');
var XBee = require('./xbee.js');

function XBeePoolManager(poolRefreshTime) {
  EventEmitter.call(this);
  var me = this;
  this.openConnections = {};
  this.disconnected = {};
  this.poolRefreshTime = poolRefreshTime || 10000;
}

util.inherits(XBeePoolManager, EventEmitter);

XBeePoolManager.prototype.start = function () {
  var me = this;
  if (!this.reconnectionsHandler) {
    this.reconnectionsHandler = setInterval(function () {
      var keys = Object.keys(me.disconnected);
      keys.forEach(function (id) {
        me.openConnections[id].init();
      });
    }, me.poolRefreshTime);
  }
};

XBeePoolManager.prototype.stop = function () {
  if (this.reconnectionsHandler) {
    clearInterval(this.reconnectInterval);
    this.reconnectInterval = null;
  }
};

XBeePoolManager.prototype.get = function (nodeId, config) {
  var me = this;
  var xBee = this.openConnections[config.id];
  
  if (!xBee) {
    xBee = new XBee(config);
    me.openConnections[config.id] = me.disconnected[config.id] = xBee;

    xBee.on('disconnect' + config.id, function () {
      me.disconnected[config.id] = true;
    });

    xBee.on('open' + config.id, function () {
      delete me.disconnected[config.id];
    });

  }
  me.emit('xbee' + nodeId, xBee);
};

XBeePoolManager.prototype.cleanUp = function (cb) {
  var xBeeKeys = Object.keys(this.openConnections);
  var me = this;
  this.stop();
  if (xBeeKeys.length > 0) {
    var xBee = this.openConnections[xBeeKeys[0]];
    delete this.openConnections[xBeeKeys[0]];
    xBee.close(function (err) {
      me.cleanUp(cb);
    });
  } else {
    cb();
  }
};

module.exports = XBeePoolManager;
