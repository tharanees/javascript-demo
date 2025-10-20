const WebSocket = require('ws');
const { WebSocketServer } = WebSocket;
const { randomUUID } = require('crypto');
const config = require('../config');
const logger = require('../utils/logger');

class RealtimeHub {
  constructor(binanceService) {
    this.binanceService = binanceService;
    this.clients = new Map();
    this.subscriptions = new Map();
    this.heartbeatTimer = null;
  }

  attach(httpServer) {
    this.server = new WebSocketServer({ server: httpServer, path: '/ws' });
    this.server.on('connection', (socket) => this.handleConnection(socket));

    this.unsubscribe = this.binanceService.on('market:update', ({ symbol, state }) => {
      const watchers = this.subscriptions.get(symbol);
      if (!watchers) {
        return;
      }
      const payload = JSON.stringify({ type: 'market:update', symbol, data: state });
      watchers.forEach((clientId) => {
        const client = this.clients.get(clientId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    });

    this.startHeartbeat();
    logger.info('Realtime hub attached');
  }

  startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(async () => {
      try {
        const metrics = await this.binanceService.getGlobalMetrics();
        const payload = JSON.stringify({ type: 'global:metrics', data: metrics });
        this.clients.forEach((socket) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(payload);
          }
        });
      } catch (error) {
        logger.warn('Failed to broadcast global metrics', error.message);
      }
    }, config.telemetry.heartbeatInterval);
  }

  handleConnection(socket) {
    const clientId = randomUUID();
    this.clients.set(clientId, socket);
    logger.info(`Client connected ${clientId}`);

    socket.send(JSON.stringify({ type: 'connected', clientId }));

    socket.on('message', async (raw) => {
      try {
        const message = JSON.parse(raw);
        await this.handleMessage(clientId, socket, message);
      } catch (error) {
        logger.warn('Invalid message from client', error.message);
      }
    });

    socket.on('close', () => {
      logger.info(`Client disconnected ${clientId}`);
      this.cleanupClient(clientId);
    });
  }

  async handleMessage(clientId, socket, message) {
    const { type, symbol } = message;
    switch (type) {
      case 'subscribe':
        if (!symbol) {
          socket.send(JSON.stringify({ type: 'error', message: 'Symbol is required' }));
          return;
        }
        await this.binanceService.ensureStream(symbol);
        this.addSubscription(clientId, symbol.toUpperCase());
        socket.send(JSON.stringify({ type: 'subscribed', symbol: symbol.toUpperCase() }));
        break;
      case 'unsubscribe':
        if (!symbol) {
          return;
        }
        this.removeSubscription(clientId, symbol.toUpperCase());
        socket.send(JSON.stringify({ type: 'unsubscribed', symbol: symbol.toUpperCase() }));
        break;
      case 'snapshot':
        if (!symbol) {
          socket.send(JSON.stringify({ type: 'error', message: 'Symbol is required' }));
          return;
        }
        await this.binanceService.ensureStream(symbol);
        socket.send(
          JSON.stringify({
            type: 'snapshot',
            symbol: symbol.toUpperCase(),
            data: this.binanceService.marketSnapshot(symbol.toUpperCase())
          })
        );
        break;
      default:
        socket.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${type}` }));
    }
  }

  addSubscription(clientId, symbol) {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
    }
    this.subscriptions.get(symbol).add(clientId);
  }

  removeSubscription(clientId, symbol) {
    const watchers = this.subscriptions.get(symbol);
    if (!watchers) {
      return;
    }
    watchers.delete(clientId);
    if (watchers.size === 0) {
      this.subscriptions.delete(symbol);
    }
  }

  cleanupClient(clientId) {
    this.clients.delete(clientId);
    this.subscriptions.forEach((watchers, symbol) => {
      if (watchers.has(clientId)) {
        watchers.delete(clientId);
        if (watchers.size === 0) {
          this.subscriptions.delete(symbol);
        }
      }
    });
  }
}

module.exports = RealtimeHub;
