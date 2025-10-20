const dataService = require('../services/dataService');
const analyticsService = require('../services/analyticsService');

const resolvers = {
  Query: {
    assets: (_, args) => {
      const { limit = 50, offset = 0 } = args;
      const assets = dataService.getAssets();
      return assets.slice(offset, offset + limit);
    },
    asset: (_, { id }) => dataService.getAsset(id),
    marketSummary: () => analyticsService.getMarketSummary(),
    topMovers: (_, { limit }) => analyticsService.getTopMovers(limit),
    changeDistribution: () => analyticsService.getChangeDistribution(),
    dominance: (_, { limit }) => analyticsService.getDominance(limit),
  },
  Asset: {
    history: (asset) => dataService.getHistory(asset.id),
  },
};

module.exports = resolvers;
