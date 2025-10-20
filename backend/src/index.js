const express = require('express');
const http = require('http');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const dataService = require('./services/dataService');
const { initWebsocket } = require('./websocket/realtime');

async function startServer() {
  const app = express();
  app.use(cors());

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql' });

  app.get('/health', (_, res) => {
    res.json({ status: 'ok', lastUpdated: dataService.getLastUpdated() });
  });

  const server = http.createServer(app);
  initWebsocket(server);

  const PORT = process.env.PORT || 4000;

  server.listen(PORT, async () => {
    await dataService.start();
    // eslint-disable-next-line no-console
    console.log(`🚀 Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`);
  });
}

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error);
  process.exit(1);
});
