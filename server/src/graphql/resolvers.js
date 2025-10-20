const GraphQLJSON = require('graphql-type-json');
const binanceService = require('../services/binanceService');

module.exports = {
  JSON: GraphQLJSON,
  Query: {
    marketSummary: async (_, { symbol }) => binanceService.getMarketSummary(symbol),
    marketLeaders: async (_, { limit = 10, sortKey }) =>
      binanceService.getMarketLeaders(limit, sortKey || 'priceChangePercent'),
    assetMetrics: async (_, { symbol }) => binanceService.getAssetMetrics(symbol),
    globalMetrics: async () => binanceService.getGlobalMetrics(),
    symbols: async (_, { limit = 50 }) => binanceService.getSymbols(limit)
  }
};
