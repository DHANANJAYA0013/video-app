import { io } from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

class SFUClient {
  constructor() {
    this.socket = null;
    this.device = null;
    this.sendTransport = null;
    this.recvTransport = null;
    this.producers = new Map(); // kind -> producer
    this.consumers = new Map(); // consumerId -> consumer
    this.roomId = null;
    this.displayName = null;

    // Callbacks
    this.onNewConsumer = null;
    this.onConsumerClosed = null;
    this.onPeerJoined = null;
    this.onPeerLeft = null;
    this.onChatMessage = null;
    this.onNewProducer = null;
    this.onProducerPaused = null;
    this.onProducerResumed = null;
  }

  connect() {
    this.socket = io(SERVER_URL, { transports: ['websocket'] });

    this.socket.on('connect', () => console.log('Socket connected:', this.socket.id));
    this.socket.on('disconnect', () => console.log('Socket disconnected'));

    this.socket.on('peerJoined', (data) => this.onPeerJoined?.(data));
    this.socket.on('peerLeft', (data) => this.onPeerLeft?.(data));
    this.socket.on('chatMessage', (data) => this.onChatMessage?.(data));
    this.socket.on('consumerClosed', ({ consumerId }) => {
      this.consumers.delete(consumerId);
      this.onConsumerClosed?.(consumerId);
    });
    this.socket.on('newProducer', (data) => {
      this.onNewProducer?.(data);
      this._consumeRemoteProducer(data.producerId);
    });
    this.socket.on('producerPaused', (data) => this.onProducerPaused?.(data));
    this.socket.on('producerResumed', (data) => this.onProducerResumed?.(data));

    return this.socket;
  }

  emit(event, data) {
    return new Promise((resolve) => {
      this.socket.emit(event, data, resolve);
    });
  }

  async joinRoom(roomId, displayName) {
    this.roomId = roomId;
    this.displayName = displayName;

    const { rtpCapabilities, existingPeers, error } = await this.emit('joinRoom', { roomId, displayName });
    if (error) throw new Error(error);

    this.device = new mediasoupClient.Device();
    await this.device.load({ routerRtpCapabilities: rtpCapabilities });

    await this._createSendTransport();
    await this._createRecvTransport();

    // Consume existing peers' producers
    for (const peer of existingPeers) {
      for (const producerId of peer.producers) {
        await this._consumeRemoteProducer(producerId);
      }
    }

    return existingPeers;
  }

  async _createSendTransport() {
    const params = await this.emit('createTransport', { direction: 'send' });
    if (params.error) throw new Error(params.error);

    this.sendTransport = this.device.createSendTransport(params);

    this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      const res = await this.emit('connectTransport', {
        transportId: this.sendTransport.id,
        dtlsParameters,
      });
      res?.error ? errback(new Error(res.error)) : callback();
    });

    this.sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
      const res = await this.emit('produce', { kind, rtpParameters, appData });
      res?.error ? errback(new Error(res.error)) : callback({ id: res.producerId });
    });
  }

  async _createRecvTransport() {
    const params = await this.emit('createTransport', { direction: 'recv' });
    if (params.error) throw new Error(params.error);

    this.recvTransport = this.device.createRecvTransport(params);

    this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      const res = await this.emit('connectTransport', {
        transportId: this.recvTransport.id,
        dtlsParameters,
      });
      res?.error ? errback(new Error(res.error)) : callback();
    });
  }

  async produce(track) {
    if (!this.sendTransport) throw new Error('Send transport not ready');
    const producer = await this.sendTransport.produce({ track });
    this.producers.set(track.kind, producer);
    return producer;
  }

  async _consumeRemoteProducer(producerId) {
    if (!this.recvTransport) return;
    const res = await this.emit('consume', {
      producerId,
      rtpCapabilities: this.device.rtpCapabilities,
    });
    if (res?.error) {
      console.warn('Cannot consume:', res.error);
      return;
    }

    const consumer = await this.recvTransport.consume({
      id: res.consumerId,
      producerId: res.producerId,
      kind: res.kind,
      rtpParameters: res.rtpParameters,
    });

    this.consumers.set(consumer.id, consumer);

    this.onNewConsumer?.({
      consumer,
      producerSocketId: res.producerSocketId,
      kind: res.kind,
    });

    return consumer;
  }

  async pauseProducer(kind) {
    const producer = this.producers.get(kind);
    if (!producer) return;
    await producer.pause();
    await this.emit('pauseProducer', { producerId: producer.id });
  }

  async resumeProducer(kind) {
    const producer = this.producers.get(kind);
    if (!producer) return;
    await producer.resume();
    await this.emit('resumeProducer', { producerId: producer.id });
  }

  sendChatMessage(message) {
    this.socket.emit('chatMessage', { roomId: this.roomId, message });
  }

  disconnect() {
    this.producers.forEach((p) => p.close());
    this.consumers.forEach((c) => c.close());
    this.sendTransport?.close();
    this.recvTransport?.close();
    this.socket?.disconnect();
    this.producers.clear();
    this.consumers.clear();
    this.sendTransport = null;
    this.recvTransport = null;
    this.device = null;
  }
}

export default SFUClient;
