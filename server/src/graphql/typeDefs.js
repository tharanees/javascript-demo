const { gql } = require('apollo-server-express');

module.exports = gql`
  type DepthLevel {
    price: Float!
    quantity: Float!
  }

  type OrderBook {
    lastUpdateId: Float
    bids: [DepthLevel!]!
    asks: [DepthLevel!]!
  }

  type Trade {
    eventTime: Float
    price: Float
    quantity: Float
    isBuyerMaker: Boolean
  }

  type Volatility {
    variance: Float!
    standardDeviation: Float!
  }

  type PricePoint {
    time: Float!
    close: Float!
  }

  type MarketSnapshot {
    symbol: String!
    ticker: Ticker
    depth: OrderBook
    trades: [Trade!]!
    tradeVelocity: Float
    buyVolume: Float
    sellVolume: Float
    imbalance: Float
    lastTrade: Trade
    lastUpdated: Float
    series: [PricePoint!]
    volatility: Volatility
  }

  type Ticker {
    eventTime: Float
    price: Float
    priceChange: Float
    priceChangePercent: Float
    highPrice: Float
    lowPrice: Float
    openPrice: Float
    volume: Float
    quoteVolume: Float
    bestBid: Float
    bestAsk: Float
  }

  type MarketLeader {
    symbol: String!
    price: Float!
    priceChangePercent: Float!
    volume: Float!
    quoteVolume: Float!
    weightedAvgPrice: Float!
    highPrice: Float!
    lowPrice: Float!
  }

  type PriceBands {
    highest: Float!
    lowest: Float!
    average: Float!
  }

  type AssetMetrics {
    symbol: String!
    lastPrice: Float
    priceChangePercent: Float
    quoteVolume: Float
    tradeVelocity: Float
    buyVolume: Float
    sellVolume: Float
    imbalance: Float
    orderBook: OrderBook
    recentTrades: [JSON!]!
    priceBands: PriceBands!
    momentum: [Float!]!
    klines: [JSON!]!
    largestTrade: JSON
    smallestTrade: JSON
  }

  type GlobalMetrics {
    totalVolume: Float!
    totalQuoteVolume: Float!
    advances: Int!
    decliners: Int!
    advanceDeclineRatio: Float!
    extremeMovers: [MarketLeader!]!
  }

  scalar JSON

  type Query {
    marketSummary(symbol: String!): MarketSnapshot
    marketLeaders(limit: Int, sortKey: String): [MarketLeader!]!
    assetMetrics(symbol: String!): AssetMetrics
    globalMetrics: GlobalMetrics!
    symbols(limit: Int): [String!]!
  }
`;
