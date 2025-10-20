const { WebSocketServer } = require('ws');
const dataService = require('../services/dataService');

function initWebsocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  const broadcast = (payload) => {
    const message = JSON.stringify(payload);
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  };

  wss.on('connection', (socket) => {
    const assets = dataService.getAssets();
    socket.send(
      JSON.stringify({
        type: 'snapshot',
        data: {
          lastUpdated: dataService.getLastUpdated(),
          assets,
          source: dataService.getDataSource(),
        },
      }),
    );
  });

  dataService.on('assets-updated', ({ assets, source, usedFallback }) => {
    broadcast({
      type: 'update',
      data: {
        lastUpdated: dataService.getLastUpdated(),
        assets,
        source,
        usedFallback,
      },
    });
  });

  dataService.on('fallback', (payload) => {
    broadcast({
      type: 'warning',
      data: {
        message: payload.message,
        lastUpdated: dataService.getLastUpdated(),
        source: dataService.getDataSource(),
      },
    });
  });

  return wss;
}

module.exports = {
  initWebsocket,
};
