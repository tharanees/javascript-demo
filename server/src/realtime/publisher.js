const { Server } = require('ws');
const {
  fetchLineStatuses,
  fetchArrivalsForStop,
  fetchDisruptions
} = require('../services/tflService');
const { buildRealtimeSnapshot } = require('../services/insightsService');

const createRealtimePublisher = ({
  httpServer,
  path = '/realtime',
  mode = 'tube',
  stopPointIds = [],
  pollInterval = 30000
}) => {
  const wss = new Server({ server: httpServer, path });
  let latestSnapshot = null;
  let pollTimer = null;
  let isPolling = false;

  const broadcast = (snapshot) => {
    const message = JSON.stringify({ type: 'snapshot', payload: snapshot });
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  };

  const fetchSnapshot = async () => {
    if (isPolling) {
      return latestSnapshot;
    }

    isPolling = true;
    try {
      const [lineStatuses, disruptions] = await Promise.all([
        fetchLineStatuses(mode),
        fetchDisruptions(mode)
      ]);

      const arrivalsByStop = {};
      await Promise.all(
        stopPointIds.map(async (stopId) => {
          try {
            arrivalsByStop[stopId] = await fetchArrivalsForStop(stopId);
          } catch (error) {
            arrivalsByStop[stopId] = [];
            console.error(`Realtime poll failed for stop ${stopId}`, error);
          }
        })
      );

      latestSnapshot = buildRealtimeSnapshot({
        lineStatuses,
        arrivalsByStop,
        disruptions
      });
      broadcast(latestSnapshot);
    } catch (error) {
      console.error('Failed to refresh realtime snapshot', error);
    } finally {
      isPolling = false;
    }

    return latestSnapshot;
  };

  wss.on('connection', (socket) => {
    if (latestSnapshot) {
      socket.send(JSON.stringify({ type: 'snapshot', payload: latestSnapshot }));
    } else {
      fetchSnapshot().then((snapshot) => {
        if (snapshot) {
          try {
            socket.send(JSON.stringify({ type: 'snapshot', payload: snapshot }));
          } catch (error) {
            console.error('Failed to send initial snapshot to client', error);
          }
        }
      });
    }
  });

  const start = () => {
    if (pollTimer) return;
    pollTimer = setInterval(fetchSnapshot, pollInterval);
    fetchSnapshot();
  };

  const stop = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    wss.close();
  };

  return {
    start,
    stop,
    fetchSnapshot,
    wss
  };
};

module.exports = { createRealtimePublisher };
