import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';

const SUPPORTED_CHANNELS = ['ticker', 'miniTicker', 'trade', 'aggTrade', 'bookTicker', 'depth'];

export const createWebSocketServer = (httpServer, streamService) => {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const subscriptionsByClient = new Map();

  const send = (socket, payload) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  };

  wss.on('connection', (socket) => {
    const clientId = randomUUID();
    subscriptionsByClient.set(socket, new Map());

    send(socket, {
      type: 'connection_ack',
      clientId,
      supportedChannels: SUPPORTED_CHANNELS,
    });

    socket.on('message', (rawMessage) => {
      let message;
      try {
        message = JSON.parse(rawMessage.toString());
      } catch (error) {
        send(socket, { type: 'error', error: 'Invalid JSON payload' });
        return;
      }

      const clientSubscriptions = subscriptionsByClient.get(socket);

      switch (message.type) {
        case 'subscribe': {
          const { channel, symbol } = message;
          if (!channel || !symbol) {
            send(socket, { type: 'error', error: 'channel and symbol are required' });
            return;
          }

          if (!SUPPORTED_CHANNELS.includes(channel)) {
            send(socket, { type: 'error', error: `Unsupported channel: ${channel}` });
            return;
          }

          const key = `${symbol.toUpperCase()}:${channel}`;
          if (clientSubscriptions.has(key)) {
            send(socket, { type: 'warning', message: `Already subscribed to ${key}` });
            return;
          }

          try {
            const subscription = streamService.subscribe({ symbol, channel }, (payload) => {
              send(socket, { type: 'data', channel, symbol: symbol.toUpperCase(), payload });
            });

            clientSubscriptions.set(key, subscription);
            send(socket, { type: 'subscribed', channel, symbol: symbol.toUpperCase() });
          } catch (error) {
            send(socket, { type: 'error', error: error.message });
          }
          break;
        }
        case 'unsubscribe': {
          const { channel, symbol } = message;
          const key = `${symbol?.toUpperCase()}:${channel}`;
          const subscription = clientSubscriptions.get(key);
          if (subscription) {
            subscription.unsubscribe();
            clientSubscriptions.delete(key);
            send(socket, { type: 'unsubscribed', channel, symbol: symbol?.toUpperCase() });
          }
          break;
        }
        case 'ping': {
          send(socket, { type: 'pong', timestamp: Date.now() });
          break;
        }
        default:
          send(socket, { type: 'error', error: `Unknown message type: ${message.type}` });
      }
    });

    socket.on('close', () => {
      const clientSubscriptions = subscriptionsByClient.get(socket) || new Map();
      for (const subscription of clientSubscriptions.values()) {
        subscription.unsubscribe();
      }
      subscriptionsByClient.delete(socket);
    });
  });

  return wss;
};
