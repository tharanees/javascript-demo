const express = require('express');
const http = require('http');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const config = require('./config');
const binanceService = require('./services/binanceService');
const RealtimeHub = require('./realtime/hub');
const logger = require('./utils/logger');

async function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql' });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  const httpServer = http.createServer(app);
  const realtimeHub = new RealtimeHub(binanceService);
  realtimeHub.attach(httpServer);

  await binanceService.initialize();

  httpServer.listen(config.app.port, config.app.host, () => {
    logger.info(`🚀 GraphQL ready at http://${config.app.host}:${config.app.port}${apolloServer.graphqlPath}`);
    logger.info(`🔌 WebSocket hub listening at ws://${config.app.host}:${config.app.port}/ws`);
  });

  return { app, httpServer, apolloServer, realtimeHub };
}

module.exports = createServer;
