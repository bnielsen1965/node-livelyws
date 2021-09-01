
import { default as EventEmitter } from 'events';
import * as WebSocket from 'ws';

const Defaults = {
  debug: false,
  reconnect: true,
  reconnectInterval: 1000,
  heartbeatInterval: 5000,
  heartbeatTimeout: 5000,
  pingMessage: 'ClientWebSocket',
  messagePing: false
};

class LivelyWS extends EventEmitter {
  constructor (url, protocols, options, settings) {
    super();
    this.url = url;
    this.protocols = protocols || [];
    this.options = options || {};
    this.settings = Object.assign({}, Defaults, settings);
    this.websocket = null;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.heartbeatTimeoutTimer = null;
  }

  // initialize websocket
  init () {
    this.debug('Initialize client websocket.');
    if (this.connect()) this.configure();
    else this.reconnect();
  }

  // create websocket connection
  connect () {
    this.debug('Connecting client websocket.');
    try {
      this.websocket = new WebSocket(this.url, this.protocols, this.options);
    }
    catch (error) {
      this.error(new Error(`Failed to initialize websocket. ${error.message}`));
      delete this.websocket;
      this.websocket = null;
    }
    return this.websocket;
  }

  // reconnect the websocket
  reconnect () {
    if (!this.settings.reconnect) return;
    this.debug('Reconnect client websocket.');
    if (this.connect()) this.configure();
    else this.reconnectTimer = setTimeout(this.reconnect, this.settings.reconnectInterval);
  }

  // configure websocket
  configure () {
    this.debug('Configure client websocket.');
    this.websocket
      .on('error', this.onError.bind(this))
      .on('open', this.onOpen.bind(this))
      .on('close', this.onClose.bind(this))
      .on('message', this.onMessage.bind(this))
      .on('pong', this.onPong.bind(this))
      .on('ping', this.onPing.bind(this));
  }

  // start heartbeat interval
  startHeartbeat () {
    this.debug('Start heartbeat.');
    this.stopHeartbeat();
    this.heartbeatTimer = setTimeout(this.heartbeat.bind(this), this.settings.heartbeatInterval);
    this.debug('Heartbeat started.');
  }

  // stop heartbeat interval
  stopHeartbeat () {
    if (!this.heartbeatTimer) return;
    this.debug('Stop heartbeat.');
    clearTimeout(this.heartbeatTimer);
  }

  // perform heartbeat
  heartbeat () {
    this.debug('Send heartbeat.');
    this.emit('heartbeat');
    try {
      this.ping();
    }
    catch (error) {
      this.heartbeatFail(error);
      return;
    }
    this.startHeartbeatTimeout();
  }

  // start timer for heartbeat timeout
  startHeartbeatTimeout () {
    this.debug('Start heartbeat timeout.');
    this.heartbeatTimeoutTimer = setTimeout(this.heartbeatTimeout.bind(this), this.settings.heartbeatTimeout);
  }

  // stop heartbeat timeout timer
  stopHeartbeatTimeout () {
    this.debug('Stop heartbeat timeout timer.');
    clearTimeout(this.heartbeatTimeoutTimer);
    this.startHeartbeat();
  }

  // handle heartbeat timeout
  heartbeatTimeout () {
    this.heartbeatFail(new Error('Heartbeat timeout.'));
  }

  // process failed heartbeat
  heartbeatFail (error) {
    this.error(new Error(`Heartbeat failed. ${error.message}`));
    this.close(1000, 'Heartbeat failure.');
  }

  // process websocket error event
  onError (error) {
    this.error(new Error(`WebSocket error. ${error.message}`));
  }

  // process websocket open event
  onOpen (openEvent) {
    if (this.websocket.readyState !== 1) return;
    this.emit('open', openEvent);
    this.startHeartbeat();
  }

  // process websocket close event
  onClose (closeEvent) {
    this.emit('close', closeEvent); // research websocket CloseEvent
    this.stopHeartbeat();
    this.reconnect();
  }

  // process websocket message event
  onMessage (message) {
    this.emit('message', message);
  }

  // process websocket pong frame event
  onPong (message) {
    this.emit('pong', message.toString());
    this.stopHeartbeatTimeout();
  }

  // process webscoket ping frame event
  onPing (message) {
    this.emit('ping', message.toString());
  }

  // close websocket
  close (code, reason) {
    this.websocket.close(code, reason);
  }

  // check if websocket can send ping frame
  canPing () {
    return this.websocket && this.websocket.ping;
  }

  // send ping frame or message
  ping (data) {
    if (this.settings.messagePing || !this.canPing()) this.send(this.settings.pingMessage);
    else this.websocket.ping(this.settings.pingMessage);
  }

  // send websocket message
  send (data) {
    this.debug(`Send data. ${data}`)
    this.websocket.send(data);
  }

  // emit debug message
  debug (message) {
    if (!this.settings.debug) return;
    this.emit('debug', message);
  }

  // emit error message
  error (error) {
    this.emit('error', error.message);
  }

}

export default LivelyWS;

//module.exports = ClientWebSocket;
