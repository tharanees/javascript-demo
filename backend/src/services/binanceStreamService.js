import WebSocket from 'ws';
import EventEmitter from 'events';

const BINANCE_STREAM_URL = 'wss://stream.binance.com:9443/ws';

const STREAM_BUILDERS = {
  ticker: (symbol) => `${symbol.toLowerCase()}@ticker`,
  miniTicker: (symbol) => `${symbol.toLowerCase()}@miniTicker`,
  trade: (symbol) => `${symbol.toLowerCase()}@trade`,
  aggTrade: (symbol) => `${symbol.toLowerCase()}@aggTrade`,
  bookTicker: (symbol) => `${symbol.toLowerCase()}@bookTicker`,
  depth: (symbol) => `${symbol.toLowerCase()}@depth5@100ms`,
};

const HEARTBEAT_INTERVAL = 30_000;

export class BinanceStreamService extends EventEmitter {
  constructor() {
    super();
    this.streams = new Map();
  }

  createStreamKey(symbol, channel) {
    return `${symbol.toUpperCase()}:${channel}`;
  }

  subscribe({ symbol, channel }, listener) {
    const streamKey = this.createStreamKey(symbol, channel);
    const streamConfig = this.ensureStream(streamKey, symbol, channel);

    streamConfig.subscribers.add(listener);

    return {
      unsubscribe: () => {
        this.unsubscribe(streamKey, listener);
      },
    };
  }

  unsubscribe(streamKey, listener) {
    const streamConfig = this.streams.get(streamKey);
    if (!streamConfig) return;

    streamConfig.subscribers.delete(listener);
    if (streamConfig.subscribers.size === 0) {
      streamConfig.socket.terminate();
      clearInterval(streamConfig.heartbeat);
      this.streams.delete(streamKey);
      this.emit('stream:closed', { streamKey });
    }
  }

  ensureStream(streamKey, symbol, channel) {
    if (this.streams.has(streamKey)) {
      return this.streams.get(streamKey);
    }

    const builder = STREAM_BUILDERS[channel];
    if (!builder) {
      throw new Error(`Unsupported channel: ${channel}`);
    }

    const streamName = builder(symbol);
    const socket = new WebSocket(`${BINANCE_STREAM_URL}/${streamName}`);

    const streamConfig = {
      streamName,
      symbol: symbol.toUpperCase(),
      channel,
      socket,
      subscribers: new Set(),
      heartbeat: null,
    };

    socket.on('open', () => {
      this.emit('stream:open', { streamKey, streamName });
      streamConfig.heartbeat = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.ping();
        }
      }, HEARTBEAT_INTERVAL);
    });

    socket.on('message', (data) => {
      let payload = null;
      try {
        payload = JSON.parse(data.toString());
      } catch (error) {
        this.emit('stream:error', { streamKey, error });
        return;
      }

      for (const subscriber of streamConfig.subscribers) {
        try {
          subscriber(payload);
        } catch (error) {
          this.emit('subscriber:error', { streamKey, error });
        }
      }
    });

    socket.on('error', (error) => {
      this.emit('stream:error', { streamKey, error });
    });

    socket.on('close', () => {
      clearInterval(streamConfig.heartbeat);
      this.emit('stream:closed', { streamKey });
      this.streams.delete(streamKey);
    });

    this.streams.set(streamKey, streamConfig);
    return streamConfig;
  }
}
