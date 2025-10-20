const http = require('http');
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const config = require('./config');
const { createRealtimePublisher } = require('./realtime/publisher');

async function start() {
  const app = express();

  const corsOptions = {
    origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
    credentials: true
  };
  app.use(cors(corsOptions));

  app.get('/health', (_, res) => {
    res.json({ status: 'ok', mode: config.defaultMode });
  });

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (error) => ({
      message: error.message,
      path: error.path,
      extensions: error.extensions
    })
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql', cors: false });

  const httpServer = http.createServer(app);

  const realtimePublisher = createRealtimePublisher({
    httpServer,
    path: '/realtime',
    mode: config.defaultMode,
    stopPointIds: config.realtime.stopPointIds,
    pollInterval: config.realtime.pollInterval
  });
  realtimePublisher.start();

  const server = httpServer.listen(config.port, () => {
    console.log(`🚉 Realtime dashboard backend ready at http://localhost:${config.port}${apolloServer.graphqlPath}`);
    console.log(`📡 WebSocket endpoint available at ws://localhost:${config.port}/realtime`);
  });

  const shutdown = () => {
    console.log('Shutting down gracefully...');
    realtimePublisher.stop();
    server.close(() => {
      apolloServer.stop().then(() => {
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((error) => {
  console.error('Failed to start backend server', error);
  process.exit(1);
});
