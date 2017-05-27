module.exports = function (RED) {
  "use strict";
  var util = require('util');
  var events = require('events');
  var SerialPort = require('serialport');
  var xbee_api = require('xbee-api');
  var C = xbee_api.constants;

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
    this.xbee = RED.nodes.getNode(config.serialPort);
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

    this.xbee = RED.nodes.getNode(config.serialPort);
    if (this.xbee){
      this.log('Got XBee');
      this.log(JSON.stringify(this.xbee));
    }

    this.log('TODO: complete the RX task with the configured node when event arrives!');
    node.send({payload:'TODO: pending'});
  }

  RED.nodes.registerType("xbee-tx", xbeeTx);
  RED.nodes.registerType("xbee-rx", xbeeRx);
  RED.nodes.registerType("xbee-config", xbeeConfigNode);

}