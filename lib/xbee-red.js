module.exports = function (RED) {
  "use strict";

  var XBeePoolManager = require('./xbeepool.js');
  var xBeePoolManager = new XBeePoolManager();

  // XBee Configuration Node shared by XBee nodes
  function xbeeConfigNode(n) {
    RED.nodes.createNode(this, n);
    this.apiMode = parseInt(n.apiMode) || 1;
    this.rawFrames = n.rawFrames || false;
    this.convertAdc = n.convertAdc || true;
    this.vrefAdc = parseInt(n.vrefAdc) || 1200;
    this.serialPort = n.serialPort;
    this.lock = n.lock || true;
    this.baudRate = parseInt(n.baudRate) || 9600;
    this.dataBits = parseInt(n.dataBits) || 8;
    this.stopBits = parseInt(n.stopBits) || 1;
    this.parity = n.parity || 'none';
    this.bufferSize = parseInt(n.bufferSize) || 65536;
    this.rtscts = n.rtscts || false;
    this.xon = n.xon || false;
    this.xoff = n.xoff || false;
    this.xany = n.xany || false;
    this.vmin = parseInt(n.vmin) || 1;
    this.vtime = parseInt(n.vtime) || 0;
  }

  // XBee node for sending data over serial connection (TX)
  function xbeeTx(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.xBeeConfig = RED.nodes.getNode(config.xBee);
    node.pool = xBeePoolManager;

    if (!node.xBeeConfig){
      node.status({ fill: "yellow", shape: "dot", text: "missing config" });
      return;
    }

    // Pool delivers an XBee to the node
    node.pool.on('xbee' + node.id, function (xBee) {
      node.xBee = xBee;
      if (node.xBee.isOpen) {
        node.status({ fill: "green", shape: "dot", text: "connected" });
      } else {
        node.status({ fill: "yellow", shape: "ring", text: "openning..." });
        node.xBee.open();
        node.xBee.on('open' + node.xBeeConfig.id, function (err) {
          if (err) {
            node.status({ fill: "red", shape: "ring", text: "disconnected" });
            node.error("Error when trying to open serial connection", err)
          } else {
            node.status({ fill: "green", shape: "dot", text: "connected" });
          }
        });
      }

      node.xBee.on('error' + node.xBeeConfig.id, function (err) {
        node.status({ fill: "yellow", shape: "ring", text: "there is an error..." });
        node.error("Error ocurred when reading/parsing, see console for details.");
        console.error(err.message);
      });

    });

    // Get XBee from the Pool, then events start firing....
    xBeePoolManager.get(node.id, node.xBeeConfig);

    // When data arrives to the node, will send with XBee
    node.on('input', function (msg) {
      node.log('TODO: Sending payload to XBee: ' + msg.payload);
      node.xBee.transmit(msg.payload);
    });

    // Clean open XBee connections
    node.on('close', function (done) {
      node.pool.removeAllListeners('xbee' + node.id);
      xBeePoolManager.cleanUp(function (err) {
        done();
      });
      node.pool = node.xBee = null;
    });

  }

  // XBee node to Receive data (TX)
  function xbeeRx(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.xBeeConfig = RED.nodes.getNode(config.xBee);
    node.pool = xBeePoolManager;

    if (!node.xBeeConfig){
      node.status({ fill: "yellow", shape: "dot", text: "missing config" });
      return;
    }

    // Pool delivers an XBee to the node
    node.pool.on('xbee' + node.id, function (xBee) {
      node.xBee = xBee;
      if (node.xBee.isOpen) {
        node.status({ fill: "green", shape: "dot", text: "s-connected" });
        node.xBee.listen();
      } if (node.xBee.isError){
        node.status({ fill: "red", shape: "ring", text: "disconnected" });
      }else {
        node.status({ fill: "yellow", shape: "ring", text: "openning..." });
        node.xBee.open();
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
      }).on('error' + node.xBeeConfig.id, function (err) {
        node.status({ fill: "yellow", shape: "ring", text: "error reading..." });
        node.error("Error ocurred when reading/parsing, see console for details.");
        console.error(err.message);
      });

    });

    // Get XBee from the Pool, then events start firing....
    xBeePoolManager.get(node.id, node.xBeeConfig);

    // Clean open XBee connections
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

  /*
  RED.httpAdmin.get("/serialports", RED.auth.needsPermission('serial.read'), function (req, res) {
    serialp.list(function (err, ports) {
      res.json(ports);
    });
  });*/

}
