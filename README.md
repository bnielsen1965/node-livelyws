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


# Constructor (url [, protocols [, options [, settings ] ] ])

The LivelyWS constructor requires an url to the websocket server to establish a
connection and has optional arguments for the websocket protocols, connection
options, and settings for the keep alive features.


## url

Connection URL to the websocket server.


## protocols

Optional array of sub-protocol strings.


## options

Optional object with option settings for websocket connection. See the
[ws WebSocket documentation](https://github.com/websockets/ws/blob/HEAD/doc/ws.md#new-websocketaddress-protocols-options),
the [NodeJS http request options](https://nodejs.org/api/http.html#http_http_request_url_options_callback),
and [NodeJS https request options](https://nodejs.org/api/https.html#https_https_request_url_options_callback).


## settings

Optional settings for the keep alive features. This is an object that may contain
one or more settings to adjust the operation of the keep alive features.

Example:
```javascript
// enable debugging events and use custom payload message in ping
let keepAliveSettings = {
  debug: true,
  pingMessage: 'custom ping payload'
};

// new LivelyWS with custom keep alive settings and no sub-protocols or websocket options.
let ws = new LivelyWS('ws://myserver.local', null, null, keepAliveSettings);
}
```


### settings.debug

Default: false

When enabled the LivelyWS instance will emit debug events to assist with diagnosing
websocket issues.


### settings.reconnect

Default: true

When set to false the LivelyWS will not attempt reconnects if the websocket fails.


### settings.reconnectInterval

Default: 1000

The number of milli-seconds to wait between websocket reconnect attempts.


### settings.heartbeatInterval

Default: 5000

The milli-seconds between keep alive heartbeats (pings).


### settings.heartbeatTimeout

Default: 5000

The number of milli-seconds to wait for a heartbeat response from the server
before closing the websocket due to heartbeat failure.


### settings.pingMessage

Default: 'ClientWebSocket'

A message string that will be sent as a payload in the heartbeat ping.


### settings.messagePing

Default: false

When set to true the heartbeat will send the settings.pingMessage as a normal
websocket message as an application level ping. This will require that the
websocket server application listens for the message and the client application
listens for the response message and calls the LivelyWS stopHeartbeatTimeout()
method to prevent heartbeat timeouts.

The default setting use the standard websocket ping and pong frames to keep the
websocket connection alive. This assumes that the websocket server supports the
websocket ping and pong frames. This will free the application from handling
the heartbeat pings and pongs.


# Events

The LivelyWS instance will emit various event during operation.


## debug

When the debug setting is enabled the LivelyWS instance will emit debug events
that include a test message payload to indicate various debug conditions during
operation.


## error

The error event type is emitted when an error is encountered during operation.
The event will include an Error object.


## open

When the websocket connection is completed and in the ready state the open event
type is emitted and the application can begin using the LivelyWS.


## close

If the websocket closes for any reason the close event is emitted and will be
accompanied with a code number and reason string.


## heartbeat

A heartbeat event type is emitted when a heartbeat ping is sent to the websocket
server.


## ping

When a ping frame is received from the websocket server the ping event type is
emitted and will include the ping payload message. In most cases this is for
information only and will be handled automatically by the LivelyWS instance.


## pong

When a pong frame is received from the websocket server the pong event type is
emitted and will include the pong payload message. This event is normally for
information only and will be handled by the LivelyWS instance.


## message

The message event is emitted when a message is received from the websocket
server. These messages should be handled by the application.

**NOTE:** When the messagePing setting is enabled the heartbeat pong response
will be recieved as a message and must be handled by the application by calling
the LivelyWS stopHeartbeatTimeout() method.


# Methods

Methods provided by the LivelyWS.


## send (data)

Use the send method to send a message to the websocket server.

Example:
```javascript
// send a JSON message to the websocket server
ws.send(JSON.stringify({ action: "restart" }));
```


## stopHeartbeatTimeout ()

Stop the heartbeat timeout timer. Used when the messagePing setting is enabled
and the application must handle server pong responses as a message. If the
application does not call the stopHeartbeatTimeout() method before the heartbeat
timeout expires then the websocket will be closed due to a heartbeat failure.


## close (code, reason [, stopReconnect ])

Use the close method to close the LivelyWS connection. A code number and reason
string should be provided. Optionally the stopReconnect flag can be set to *true*
to prevent a websocket reconnect after the close completes.
