const calculateSeverityBreakdown = (lineStatuses) => {
  return lineStatuses.reduce(
    (acc, line) => {
      line.statuses.forEach((status) => {
        const key = status.statusSeverityDescription || 'Unknown';
        acc[key] = (acc[key] || 0) + 1;
      });
      return acc;
    },
    {}
  );
};

const buildLineSummaries = (lineStatuses) =>
  lineStatuses.map((line) => {
    const mostSevere = [...line.statuses].sort((a, b) => a.statusSeverity - b.statusSeverity)[0];
    return {
      id: line.id,
      name: line.name,
      modeName: line.modeName,
      statusSeverity: mostSevere?.statusSeverity ?? null,
      statusSeverityDescription: mostSevere?.statusSeverityDescription ?? 'Unknown',
      reason: mostSevere?.reason ?? null,
      activeDisruptions: line.disruptions.length
    };
  });

const summariseDisruptions = (disruptions) =>
  disruptions.map((disruption) => ({
    lineId: disruption.affectedRoutes?.[0]?.lineId || null,
    description: disruption.description,
    category: disruption.category,
    summary: disruption.summary,
    additionalInfo: disruption.additionalInfo,
    created: disruption.created,
    lastUpdate: disruption.lastUpdate
  }));

const buildArrivalMetrics = (arrivalsByStop) => {
  const stopSummaries = Object.entries(arrivalsByStop).map(([stopPointId, arrivals]) => {
    const sortedArrivals = arrivals.slice(0, 10);
    const averageWait =
      sortedArrivals.length === 0
        ? null
        : Math.round(
            sortedArrivals.reduce((sum, arrival) => sum + (arrival.timeToStation || 0), 0) /
              sortedArrivals.length
          );

    return {
      stopPointId,
      stopName: sortedArrivals[0]?.stationName || 'Unknown',
      soonestArrival: sortedArrivals[0]?.expectedArrival || null,
      averageWait,
      platforms: Array.from(new Set(sortedArrivals.map((arrival) => arrival.platformName))).filter(Boolean),
      lineSpread: sortedArrivals.reduce((acc, arrival) => {
        acc[arrival.lineName] = (acc[arrival.lineName] || 0) + 1;
        return acc;
      }, {})
    };
  });

  return stopSummaries.sort((a, b) => (a.averageWait || Infinity) - (b.averageWait || Infinity));
};

const buildRealtimeSnapshot = ({ lineStatuses = [], arrivalsByStop = {}, disruptions = [] }) => {
  const lineSummaries = buildLineSummaries(lineStatuses);
  return {
    generatedAt: new Date().toISOString(),
    severityBreakdown: calculateSeverityBreakdown(lineStatuses),
    lineSummaries,
    arrivals: buildArrivalMetrics(arrivalsByStop),
    disruptions: summariseDisruptions(disruptions)
  };
};

module.exports = {
  calculateSeverityBreakdown,
  buildLineSummaries,
  buildArrivalMetrics,
  summariseDisruptions,
  buildRealtimeSnapshot
};
