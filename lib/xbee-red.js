module.exports = function (RED) {
  "use strict";

  var XBeePoolManager = require('./xbeepool.js');
  var xBeePoolManager = new XBeePoolManager();

  // XBee's Configuration Node, shared by nodes
  function xbeeConfigNode(n) {
    RED.nodes.createNode(this, n);
    this.serialPort = n.serialPort;
    this.baudRate = n.baudRate || 9600;
    this.parser = n.parser || 'rawParser';
  }

  // XBee node for sending data over serial connection (TX)
  function xbeeTx(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    // Get reference to the XBee attached to Serial Port
    this.xbee = RED.nodes.getNode(config.xBee);
    if (this.xbee) {
      this.log('Got XBee');
      this.log(JSON.stringify(this.xbee));
    }

    node.on('input', function (msg) {
      // Send data to XBee attached to serial port
      node.log('TODO: Sending payload to XBee: ' + msg.payload);
    });

  }

  // XBee node to Receive data (TX)
  function xbeeRx(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.xBeeConfig = RED.nodes.getNode(config.xBee);
    node.pool = xBeePoolManager;

    node.pool.on('xbee' + node.id, function (xBee) {
      node.xBee = xBee;

      if (node.xBee.isOpen) {
        node.status({ fill: "green", shape: "dot", text: "s-connected" });
        node.xBee.listen();
      } else {
        node.status({ fill: "yellow", shape: "ring", text: "openning..." });
        node.xBee.open(config.apiMode);
        node.xBee.on('open' + node.xBeeConfig.id, function (err) {
          if (err) {
            node.status({ fill: "red", shape: "ring", text: "disconnected" });
            node.error("Error when trying to open serial connection", err)
          } else {
            node.status({ fill: "green", shape: "dot", text: "connected" });
            node.xBee.listen();
          }
        });
      }

      node.xBee.on('data' + node.xBeeConfig.id, function (data) {
        node.send({ payload: data });
      });
    });

    xBeePoolManager.get(node.id, node.xBeeConfig);

    // Clean open Xbee connections
    node.on('close', function (done) {
      node.pool.removeAllListeners('xbee' + node.id);
      xBeePoolManager.cleanUp(function (err) {
        done();
      });
      node.pool = node.xBee = null;
    });
  }

  RED.nodes.registerType("xbee-tx", xbeeTx);
  RED.nodes.registerType("xbee-rx", xbeeRx);
  RED.nodes.registerType("xbee-config", xbeeConfigNode);

}
