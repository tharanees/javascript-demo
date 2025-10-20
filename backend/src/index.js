import http from 'http';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';
import { BinanceRestService } from './services/binanceRestService.js';
import { BinanceStreamService } from './services/binanceStreamService.js';
import { createWebSocketServer } from './websocket/server.js';

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const binanceRest = new BinanceRestService();
  const binanceStream = new BinanceStreamService();

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(
    '/graphql',
    cors(),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async () => ({
        services: {
          binanceRest,
        },
      }),
    }),
  );

  createWebSocketServer(httpServer, binanceStream);

  httpServer.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  });
};

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error);
  process.exit(1);
});
