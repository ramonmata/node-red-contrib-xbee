# node-red-contrib-xbee

### The purpose of this module is to easily configure and use XBee modules attached to a computer where Node-RED is installed

There was already an excellent node for XBee modules, but I was unable to make it work with the Serial Port node included in Node-RED, so I decided to build my one.


## Install 

Run the following command in your Node-RED user directory (typically `~/.node-red`):

```sh
npm install node-red-contrib-xbee
```

## Usage

Adds two nodes to the palette in the category <b>iot</b>, XBee RX and XBee TX, also includes a configuration node required by both nodes.

### XBee RX

This node will keep listening for incoming data at the configured serial port, then parses data with the xbee-api.

It then outputs `msg.payload` with a JSON object representing the data frame received.

### XBee TX

Provides access to the XBee so you can deliver data frames with it.

It expects a JSON Object with the data frame information in `msg.payload` then this node will build for you the data frame and deliver it with the serial connection.

Make sure to read the xbee-api [documentation](https://github.com/jankolkmeier/xbee-api) for the supported frames and how create the fields for the data frame you want to send.

#### Example

To send a data frame type: <i>0x10 ZigBee Transmit Request</i>

- Build the following JSON object
- Copy it to the <code>msg.payload</code>
- Send it to yout XBee TX node

```js
var myDataFrame = {
  type: 0x10,
  id: 0x01,
  destination64: "0013a200400a0127",
  destination16: "fffe",
  broadcastRadius: 0x00,
  options: 0x00,
  data: "Hello from Node-RED!"
};
```

### Credits

- [xbee-api](https://github.com/jankolkmeier/xbee-api) The xbee-api Node.js module
- [serialport](https://github.com/EmergingTechnologyAdvisors/node-serialport) Node.js package to access serial ports for reading and writing

### :)
