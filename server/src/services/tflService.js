const fetch = require('node-fetch');

const API_BASE_URL = 'https://api.tfl.gov.uk';
const USER_AGENT = 'javascript-demo-realtime-dashboard/1.0';

const appendAuthParams = (url) => {
  const appId = process.env.TFL_APP_ID;
  const appKey = process.env.TFL_APP_KEY;
  if (appId && appKey) {
    url.searchParams.set('app_id', appId);
    url.searchParams.set('app_key', appKey);
  }
};

async function fetchJson(path, queryParams = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  appendAuthParams(url);

  const response = await fetch(url.href, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`TFL API request failed (${response.status} ${response.statusText}): ${body}`);
  }

  return response.json();
}

function mapLineStatus(rawLine) {
  const { id, name, modeName, disruptions = [], serviceTypes = [], lineStatuses = [] } = rawLine;
  return {
    id,
    name,
    modeName,
    serviceTypes: serviceTypes.map((type) => ({
      name: type.name,
      uri: type.uri
    })),
    statuses: lineStatuses.map((status) => ({
      id: status.id,
      statusSeverity: status.statusSeverity,
      statusSeverityDescription: status.statusSeverityDescription,
      reason: status.reason || null,
      created: status.created,
      validityPeriods: (status.validityPeriods || []).map((period) => ({
        fromDate: period.fromDate,
        toDate: period.toDate,
        isNow: period.isNow
      }))
    })),
    disruptions: disruptions.map((disruption) => ({
      lineId: id,
      category: disruption.category,
      description: disruption.description,
      summary: disruption.summary,
      additionalInfo: disruption.additionalInfo || null,
      created: disruption.created,
      lastUpdate: disruption.lastUpdate
    }))
  };
}

function mapArrival(raw) {
  return {
    id: raw.id,
    lineId: raw.lineId,
    lineName: raw.lineName,
    platformName: raw.platformName,
    direction: raw.direction,
    stationName: raw.stationName,
    currentLocation: raw.currentLocation,
    destinationName: raw.destinationName,
    expectedArrival: raw.expectedArrival,
    timeToStation: raw.timeToStation,
    towards: raw.towards
  };
}

function mapDisruption(raw) {
  return {
    lineId: raw.lineId || raw.lineIds?.[0] || raw.routeId || raw.affectedRoutes?.[0]?.id || null,
    category: raw.category,
    type: raw.type,
    description: raw.description,
    summary: raw.summary,
    additionalInfo: raw.additionalInfo,
    created: raw.created,
    lastUpdate: raw.lastUpdate,
    affectedRoutes: raw.affectedRoutes?.map((route) => ({
      name: route.name,
      lineId: route.id
    })) || []
  };
}

function mapStopPoint(raw) {
  return {
    id: raw.id,
    name: raw.commonName,
    lat: raw.lat,
    lon: raw.lon,
    indicator: raw.indicator,
    stopType: raw.stopType,
    modes: raw.modes,
    zone: raw.zone
  };
}

async function fetchLineStatuses(mode = 'tube') {
  const data = await fetchJson(`/Line/Mode/${mode}/Status`, { detail: true });
  return data.map(mapLineStatus);
}

async function fetchArrivalsForStop(stopPointId, lineIds = []) {
  const data = await fetchJson(`/StopPoint/${stopPointId}/Arrivals`);
  const filtered = Array.isArray(lineIds) && lineIds.length > 0
    ? data.filter((arrival) => lineIds.includes(arrival.lineId))
    : data;
  return filtered
    .map(mapArrival)
    .sort((a, b) => new Date(a.expectedArrival) - new Date(b.expectedArrival));
}

async function fetchDisruptions(mode = 'tube') {
  const data = await fetchJson(`/Line/Mode/${mode}/Disruption`);
  return data.map(mapDisruption);
}

async function fetchStopPointsByLine(lineId) {
  const data = await fetchJson(`/Line/${lineId}/StopPoints`);
  return data.map(mapStopPoint);
}

module.exports = {
  fetchLineStatuses,
  fetchArrivalsForStop,
  fetchDisruptions,
  fetchStopPointsByLine
};
