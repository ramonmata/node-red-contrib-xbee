module.exports = function (RED) {
  "use strict";
  var util = require('util');
  var EventEmitter = require('events');
  var SerialPort = require('serialport');
  var xbee_api = require('xbee-api');
  var C = xbee_api.constants;

  // XBee object
  function XBee(config){
    this.config = config;
    this.isOpen = false;
    this.isListening = false;
    this.serialConnection;
  }
  // Inherits EventEmitter functionality
  util.inherits(XBee, EventEmitter);

  XBee.prototype.open = function(apiMode, cb){
    var me = this;
    // safe check if it is already open
    if (this.isOpen) return;

    this.xbeeAPI = new xbee_api.XBeeAPI({
      api_mode: parseInt(apiMode)
    });

    this.serialConnection = new SerialPort(me.config.serialPort, {
      baudrate: parseInt(me.config.baudRate),
      parser: me.xbeeAPI.rawParser(),
      autoOpen: false
    });

    this.serialConnection.open(function(err){
      if (cb){
        if(err){
          cb(err);
        }else{
          me.isOpen = true;
          cb();
        }
      }else{
        me.isOpen = true;
        me.emit('open'+me.config.id, err);
      }
    });
  }

  XBee.prototype.close = function(cb){
    var me = this;
    me.xbeeAPI.removeAllListeners('frame_object');
    me.removeAllListeners('open'+me.config.id);
    me.removeAllListeners('data'+me.config.id);
    if (this.isOpen) {
      me.serialConnection.close(function(){
        me.isOpen = false;
        cb();
      });
    }
  }

  XBee.prototype.listen = function(){
    var me = this;
    if (this.xbeeAPI && !this.isListening){
      me.isListening = true;
      me.xbeeAPI.on("frame_object", function(frame) {
        me.emit('data'+me.config.id,frame);
      });
    }
  }

  XBee.prototype.transmit = function(data){
    if (this.isOpen){
      this.serialConnection.write(data);
    }
  }

  function XBeePoolManager(){
    this.openConnections = {};
  }
  util.inherits(XBeePoolManager, EventEmitter);

  XBeePoolManager.prototype.get = function(nodeId, config){
    var me = this;
    var xBee = this.openConnections[config.id];
    if (!xBee){
      xBee = new XBee(config);
      this.openConnections[config.id] = xBee;
      this.emit('xbee'+nodeId, xBee);
    }else{
      setTimeout(function() {
        me.emit('xbee'+nodeId, xBee);
      }, 5000);
    }
  }

  XBeePoolManager.prototype.cleanUp = function(cb){
    var xBeeKeys = Object.keys(this.openConnections);
    var me = this;

    if (xBeeKeys.length>0){
      var xBee = this.openConnections[xBeeKeys[0]];
      delete this.openConnections[xBeeKeys[0]];

      xBee.close(function(err){
        me.cleanUp(cb);
      });

    } else {
      // Calling callback from node 'close' event
      cb();
    }
  }

  var xBeePoolManager = new XBeePoolManager();

  // Configuration node shared by XBee nodes
  function xbeeConfigNode(n){
    RED.nodes.createNode(this, n);
    this.serialPort = n.serialPort;
    this.baudRate = n.baudRate || 9600;
    this.parser = n.parser || 'rawParser';
  }

  function xbeeTx(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    
    // Get reference to the XBee attached to Serial Port
    this.xbee = RED.nodes.getNode(config.xBee);
    if (this.xbee){
      this.log('Got XBee');
      this.log(JSON.stringify(this.xbee));
    }

    node.on('input', function (msg) {
      // Send data to XBee attached to serial port
      node.log('TODO: Sending payload to XBee: ' + msg.payload);
    });

  }

  function xbeeRx(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.xBeeConfig = RED.nodes.getNode(config.xBee);
    node.pool = xBeePoolManager;

    node.pool.on('xbee'+node.id, function(xBee){
      node.xBee = xBee;
      if (node.xBee.isOpen){
        node.status({fill:"green",shape:"dot",text:"s-connected"});
        node.xBee.listen();
      }else{
        node.status({fill:"yellow",shape:"ring",text:"openning..."});
        node.xBee.open(config.apiMode);
        node.xBee.on('open'+node.xBeeConfig.id, function(err){
          if (err){
            node.status({fill:"red",shape:"ring",text:"disconnected"});
          }else{
            node.status({fill:"green",shape:"dot",text:"connected"});
            node.xBee.listen();
          }
        });
      }

      node.xBee.on('data'+node.xBeeConfig.id, function(data){
        node.send({payload: data});
      });

    });
    
    xBeePoolManager.get(node.id, node.xBeeConfig);

    // Clean open Xbee connections
    node.on('close', function(done){
      node.pool.removeAllListeners('xbee'+node.id);
      xBeePoolManager.cleanUp(function(err){
        done();
      });
      node.pool = node.xBee = null;
    });
  }

  RED.nodes.registerType("xbee-tx", xbeeTx);
  RED.nodes.registerType("xbee-rx", xbeeRx);
  RED.nodes.registerType("xbee-config", xbeeConfigNode);

}