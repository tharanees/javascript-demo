const {
  fetchLineStatuses,
  fetchArrivalsForStop,
  fetchDisruptions,
  fetchStopPointsByLine
} = require('../services/tflService');
const { buildRealtimeSnapshot } = require('../services/insightsService');

const toSeverityCounts = (breakdownMap = {}) =>
  Object.entries(breakdownMap)
    .map(([severity, count]) => ({ severity, count }))
    .sort((a, b) => a.severity.localeCompare(b.severity));

const toLineSpreadEntries = (lineSpread = {}) =>
  Object.entries(lineSpread)
    .map(([lineName, count]) => ({ lineName, count }))
    .sort((a, b) => b.count - a.count);

const resolvers = {
  Query: {
    lineStatuses: async (_, { mode }) => fetchLineStatuses(mode),
    arrivals: async (_, { stopPointId, lineIds }) => fetchArrivalsForStop(stopPointId, lineIds),
    disruptions: async (_, { mode }) => fetchDisruptions(mode),
    stopPointsByLine: async (_, { lineId }) => fetchStopPointsByLine(lineId),
    insightSnapshot: async (_, { mode, stopPointIds = [] }) => {
      const [lineStatuses, disruptions] = await Promise.all([
        fetchLineStatuses(mode),
        fetchDisruptions(mode)
      ]);

      const arrivalsByStop = {};
      if (Array.isArray(stopPointIds)) {
        await Promise.all(
          stopPointIds.map(async (stopId) => {
            try {
              arrivalsByStop[stopId] = await fetchArrivalsForStop(stopId);
            } catch (error) {
              arrivalsByStop[stopId] = [];
              console.error(`Failed to fetch arrivals for stop ${stopId}`, error);
            }
          })
        );
      }

      return buildRealtimeSnapshot({ lineStatuses, arrivalsByStop, disruptions });
    }
  },
  InsightSnapshot: {
    severityBreakdown: (snapshot) => toSeverityCounts(snapshot.severityBreakdown),
    arrivals: (snapshot) => snapshot.arrivals.map((arrival) => ({
      ...arrival,
      lineSpread: toLineSpreadEntries(arrival.lineSpread)
    }))
  }
};

module.exports = resolvers;
