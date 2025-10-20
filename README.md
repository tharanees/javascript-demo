# Crypto Pulse Dashboard

A full-stack JavaScript application that delivers an ultra-granular, real-time view of the cryptocurrency derivatives market using Binance's public APIs.

## Features

- **Live market data streaming** via a Node.js WebSocket bridge that multiplexes Binance ticker, trade, and depth feeds for multiple symbols.
- **GraphQL API** providing curated analytics including market leaders, symbol snapshots, asset metrics, and global breadth statistics.
- **React dashboard** (Vite + MUI) with rich visualizations such as price sparklines, liquidity gauges, depth heatmaps, and trade velocity monitors.
- **In-memory caching layer** that balances data freshness with network efficiency for high-frequency polling endpoints.
- **Scalable real-time hub** with per-client subscriptions, broadcast heartbeats, and automatic Binance stream recovery.

## Project Structure

```
server/   # Express + Apollo GraphQL backend with Binance integrations
client/   # React dashboard powered by Vite and Apollo Client
```

## Prerequisites

- Node.js 18+
- npm 9+

## Getting Started

1. **Install dependencies**

   ```bash
   cd server
   npm install

   cd ../client
   npm install
   ```

2. **Configure environment**

   Copy the backend example env and adjust as needed:

   ```bash
   cd server
   cp .env.example .env
   # edit .env to customise default symbols or ports
   ```

3. **Run the services**

   Start the backend API and WebSocket hub:

   ```bash
   npm run dev
   ```

   In another terminal launch the React dashboard:

   ```bash
   cd ../client
   npm run dev
   ```

   The client is configured to proxy GraphQL requests to `http://localhost:4000`.

## Notes

- The backend maintains live Binance WebSocket streams for the configured symbols and rebroadcasts curated updates to connected dashboard clients.
- GraphQL endpoints remain available for bulk or historical queries and complement the push feed for charting.
- The application relies on public Binance endpoints; running it in production should respect Binance rate limits and terms of service.
