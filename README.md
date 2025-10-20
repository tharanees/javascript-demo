# Real-time Crypto Intelligence Dashboard

A full-stack JavaScript demo that showcases how to build a high-fidelity crypto intelligence dashboard with a modern React frontend, GraphQL APIs, and WebSocket fan-out backed by Binance market data.

## Features

- **Granular market intelligence** – watchlist overview, price change deltas, order book depth, recent trades, and volume analytics refreshed in real time.
- **WebSocket fan-out** – a Node.js gateway multiplexes Binance WebSocket streams and broadcasts to connected browsers with fine-grained channel control.
- **GraphQL API layer** – strongly-typed queries for historical klines, order books, aggregate trades, and exchange metadata, powered by Apollo Server v4.
- **Rich React UI** – Material UI components, data visualizations via Recharts, and state management with Zustand deliver a polished trading console experience.
- **Workspace-friendly structure** – separate `backend` and `frontend` packages managed via npm workspaces.

## Project Structure

```
.
├── backend/             # Express + Apollo Server backend with Binance services and WebSocket fan-out
│   └── src/
│       ├── graphql/     # Schema definition and resolvers
│       ├── services/    # REST + WebSocket service abstractions for Binance
│       └── websocket/   # Client WebSocket server logic
├── frontend/            # Vite + React dashboard
│   └── src/
│       ├── components/  # Dashboard widgets
│       ├── graphql/     # Apollo client and queries
│       ├── hooks/       # WebSocket subscription hook
│       └── state/       # Zustand store for real-time data
├── package.json         # Workspace root scripts and tooling
└── README.md
```

## Prerequisites

- Node.js 18+
- npm 8+

## Getting Started

Install dependencies for all workspaces:

```bash
npm install
```

### Backend

```bash
npm run dev:backend
```

The backend starts on [http://localhost:4000](http://localhost:4000) and exposes:

- GraphQL endpoint: `http://localhost:4000/graphql`
- WebSocket endpoint: `ws://localhost:4000/ws`

### Frontend

In a separate terminal:

```bash
npm run start:frontend
```

The Vite dev server runs on [http://localhost:5173](http://localhost:5173) with proxy rules for `/graphql` and `/ws` so no additional configuration is required.

## Key Implementation Details

- **Binance REST integration** uses Axios with NodeCache to throttle repeated requests and deliver aggregated statistics (gainers, losers, volume leaders).
- **Binance stream multiplexing** spins up one upstream socket per `{symbol, channel}` combination and fans out payloads to every subscribed browser client.
- **Dashboard state** persists a rolling price history, depth snapshots, and trade tape for each tracked symbol, enabling responsive charts and insights.
- **Visualizations** combine Material UI, Recharts area/volume charts, and contextual chips/progress to surface actionable insights quickly.

## Scripts

| Command                | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev:backend`  | Start the backend in watch mode via `nodemon`.        |
| `npm run start:backend`| Start the backend once using Node.                    |
| `npm run start:frontend` | Launch the Vite dev server for the React dashboard. |
| `npm run build`        | Build the React frontend for production.              |

## Notes

- The Binance API enforces rate limits; caching and debouncing are employed to remain within safe thresholds.
- WebSocket streams are automatically reconnected if the upstream or downstream connection drops.
- This codebase is intended for demonstration and should be hardened further (auth, persistence, alerting) before production use.
