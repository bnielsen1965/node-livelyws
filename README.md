# Lively WebSocket

A nodejs module used to keep a websocket connection alive through routine pings
and reconnects.


# Usage

Use *npm install --save livelyws* to install the module as a dependency in your
application. Import the module in your code and create an instance of LivelyWS
connected to your websocket server. Add event handlers as needed.

Example:
```javascript
import LivelyWS from 'livelyws';

// create a lively websocket
let ws = new LivelyWS('ws://myserver.local', [], { timeout: 5000, handshakeTimeout: 5000 }, { debug: true });

// add listeners to websocket
ws
  .on('debug', message => {
    console.log(`DEBUG: ${message}`);
  })
  .on('open', () => {
    console.log('WebSocket open.');
    // send action command to websocket server
    ws.send(JSON.stringify('{"action":"start"}'));
  })
  .on('close', cev => {
    console.log('WebSocket closed.');
  })
  .on('error', error => {
    console.log(`ERROR: ${error.toString()}`);
  })
  .on('message', message => {
    console.log(message.toString());
  });

// initialize the websocket to start the connection
ws.init();
```
