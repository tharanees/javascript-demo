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
        },
      }),
    );
  });

  dataService.on('assets-updated', (assets) => {
    broadcast({
      type: 'update',
      data: {
        lastUpdated: dataService.getLastUpdated(),
        assets,
      },
    });
  });

  dataService.on('error', (error) => {
    broadcast({
      type: 'error',
      data: {
        message: error.message,
      },
    });
  });

  return wss;
}

module.exports = {
  initWebsocket,
};
