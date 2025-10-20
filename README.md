# TFL real-time JavaScript dashboard

A full-stack JavaScript demo that surfaces Transport for London (TFL) operational insights through a real-time dashboard. The backend exposes a GraphQL API and WebSocket stream that fan out live updates, while the React frontend renders granular status, disruption and arrival analytics using component libraries.

## Project structure

```
.
├── client   # React dashboard (Vite, Material UI, Apollo Client)
└── server   # Express + Apollo GraphQL API with WebSocket publisher
```

## Features

- **GraphQL APIs** for querying line status, stop arrivals, disruption reports and consolidated insight snapshots.
- **WebSocket broadcasting** that continually polls TFL endpoints and streams new snapshots to all connected clients.
- **Granular dashboard UI** with severity visualisations, per-line health, stop-level wait analytics and disruption drilldowns.
- **Configurable polling** via environment variables for adjusting transport modes, stops and cadence.

## Getting started

### 1. Install dependencies

```bash
npm run install:all
```

> ℹ️  The backend optionally uses the `TFL_APP_ID` / `TFL_APP_KEY` environment variables to authenticate larger request volumes. The public endpoints work without credentials but are rate limited.

### 2. Start the backend

```bash
npm run dev:server
```

The server boots on <http://localhost:4000>. Key endpoints:

- `POST /graphql` – GraphQL Playground compatible endpoint
- `GET /health` – simple readiness check
- `ws://localhost:4000/realtime` – live snapshot WebSocket stream

Environment variables (set in `.env` placed inside `server/`):

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `4000` | HTTP/WebSocket port |
| `TFL_MODE` | `tube` | Default mode when building snapshots |
| `STOP_POINT_IDS` | `940GZZLUOXC,940GZZLUKSX,940GZZLUPAC` | Comma separated list of stop point IDs to track arrivals |
| `POLL_INTERVAL_MS` | `30000` | Poll frequency for realtime snapshots |
| `TFL_APP_ID` / `TFL_APP_KEY` | _unset_ | Optional application credentials |

### 3. Start the frontend

```bash
npm run dev:client
```

Vite serves the dashboard on <http://localhost:5173>. The dev server proxies GraphQL and WebSocket traffic to the backend, so both services must be running.

## GraphQL overview

Example query for tube insights:

```graphql
query Dashboard($mode: String!, $stops: [ID!]) {
  lineStatuses(mode: $mode) {
    id
    name
    statuses { statusSeverityDescription reason }
  }
  insightSnapshot(mode: $mode, stopPointIds: $stops) {
    generatedAt
    severityBreakdown { severity count }
    arrivals { stopName averageWait }
    disruptions { summary category }
  }
}
```

## Frontend customisation

Adjust the transport mode toggle or update the `STOP_POINTS` list inside `client/src/App.jsx` to showcase different areas of the network. Set `VITE_GRAPHQL_URL` and `VITE_REALTIME_URL` in a `.env` file if the backend runs on a different host/port.

## Testing & linting

- `npm run lint:client` – run the Vite React lint rules
- `npm run build:client` – produce an optimised production build

> ⚠️ Network calls depend on external TFL availability. When the API is unreachable the backend logs the failure and continues retrying; the frontend will surface appropriate error or reconnect banners.

## License

MIT
