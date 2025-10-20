# Crypto Pulse Real-Time Dashboard

This project demonstrates a full-stack JavaScript application that streams and visualises live cryptocurrency market data. It features a Node.js backend exposing GraphQL APIs plus a WebSocket feed, and a React-based analytics dashboard that renders granular market insights.

## Features

- **Public dataset integration** – streams CoinCap.io market data for ~200 crypto assets when available.
- **Offline resilience** – automatically falls back to a bundled CoinCap snapshot with synthetic drifts when outbound network access is blocked.
- **GraphQL API** – rich query surface for market summaries, movers, distributions, dominance and more.
- **WebSocket updates** – pushes live asset snapshots to all connected clients for real-time interactivity.
- **Service-first backend** – modular `services/` layer powers analytics calculations and history tracking.
- **Insight-rich UI** – Material UI widgets with Recharts visualisations, live tickers, velocity gauges and paginated ledgers.

## Project structure

```
.
├── backend            # Node.js GraphQL + WebSocket server
│   ├── src
│   │   ├── graphql    # Schema & resolvers
│   │   ├── services   # Data ingestion & analytics layers
│   │   └── websocket  # Realtime broadcasting helpers
│   └── package.json
├── frontend           # Vite + React dashboard
│   ├── src
│   │   ├── components # Dashboard UI building blocks
│   │   ├── graphql    # Query documents
│   │   └── hooks      # WebSocket subscription hook
│   └── package.json
└── README.md
```

## Getting started

1. **Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   The GraphQL playground is served at `http://localhost:4000/graphql` and WebSocket updates at `ws://localhost:4000/ws`.
   When the environment prevents outbound HTTPS requests the server transparently switches to the bundled dataset – no extra setup required.

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` to explore the live dashboard. The dev server proxies GraphQL requests to the backend.

## GraphQL highlights

- `marketSummary` – aggregate market cap, volume, average change and sentiment counts.
- `topMovers(limit)` – leading gainers and laggards based on 24h change.
- `changeDistribution` – bucketed distribution for positive/negative momentum.
- `dominance(limit)` – market share for top-cap assets.
- `velocity` – short-term price velocity derived from live history samples.
- `assets(limit, offset)` – paginated asset ledger with historical price sparklines.

## WebSocket payloads

Clients subscribing to `ws://localhost:4000/ws` receive JSON messages:

- `snapshot` – full asset array on connection with latest timestamp and current data source (`remote` or `synthetic`).
- `update` – refreshed asset array every fetch cycle (~15s) including the data source and whether a fallback was used.
- `warning` – emitted when the service downgrades to the bundled snapshot because the live API is unavailable.

These payloads drive the real-time ticker and instant table updates on the dashboard.

## Dataset credit

Data is sourced from the [CoinCap](https://coincap.io/) public API. A trimmed snapshot from the same dataset ships in `backend/src/data/seedAssets.json` so the demo keeps working in offline or firewalled environments. Please review CoinCap's terms of service before using the data in production environments.
