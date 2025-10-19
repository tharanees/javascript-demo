const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Asset {
    id: ID!
    rank: Int
    symbol: String
    name: String
    supply: Float
    maxSupply: Float
    marketCapUsd: Float
    volumeUsd24Hr: Float
    priceUsd: Float
    changePercent24Hr: Float
    vwap24Hr: Float
    explorer: String
    lastUpdated: Float
    history: [PricePoint!]!
  }

  type PricePoint {
    timestamp: Float!
    priceUsd: Float!
    volumeUsd24Hr: Float!
    changePercent24Hr: Float!
  }

  type MarketSummary {
    totalMarketCapUsd: Float!
    totalVolumeUsd24Hr: Float!
    averageChangePercent24Hr: Float!
    assetsTracked: Int!
    positiveChangeCount: Int!
    negativeChangeCount: Int!
    lastUpdated: Float
  }

  type TopMovers {
    gainers: [Asset!]!
    losers: [Asset!]!
  }

  type DistributionBucket {
    label: String!
    count: Int!
  }

  type DominanceSlice {
    assetId: ID!
    symbol: String!
    dominancePercent: Float!
  }

  type VelocityMetric {
    averageVelocityPercent: Float!
    sampleSize: Int!
  }

  type Query {
    assets(limit: Int, offset: Int): [Asset!]!
    asset(id: ID!): Asset
    marketSummary: MarketSummary!
    topMovers(limit: Int): TopMovers!
    changeDistribution: [DistributionBucket!]!
    dominance(limit: Int): [DominanceSlice!]!
    velocity: VelocityMetric!
  }
`;

module.exports = typeDefs;
