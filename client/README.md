# Real-time TFL dashboard frontend

This React application consumes the GraphQL and WebSocket APIs exposed by the backend to visualise real-time Transport for London insights. It is built with Vite, Material UI, Apollo Client and Recharts.

## Available scripts

Inside the `client/` directory:

- `npm run dev` – start the Vite dev server (defaults to <http://localhost:5173>)
- `npm run build` – build a production bundle
- `npm run preview` – preview the production build locally
- `npm run lint` – run the ESLint rules configured for the project

## Environment variables

Create a `.env` file (or `.env.local`) in the `client/` directory to override defaults.

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_GRAPHQL_URL` | `http://localhost:4000/graphql` | URL of the GraphQL endpoint |
| `VITE_REALTIME_URL` | `ws://localhost:4000/realtime` | URL of the realtime WebSocket stream |

## Customisation

- Update `STOP_POINTS` in `src/App.jsx` to target different stations.
- Adjust styling through `src/theme.js` or by extending Material UI components.
- Add additional charts/tables by composing new components inside `src/components/`.

## Data refresh behaviour

The dashboard hydrates with a GraphQL query and then continues receiving snapshots through the WebSocket client. Connection state is surfaced to the user so interruptions are visible.
