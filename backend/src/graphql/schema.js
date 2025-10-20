export const typeDefs = `#graphql
  type MarketTicker {
    symbol: String!
    priceChangePercent: Float!
    lastPrice: Float!
    openPrice: Float!
    highPrice: Float!
    lowPrice: Float!
    volume: Float!
    quoteVolume: Float!
  }

  type OrderBookEntry {
    price: Float!
    quantity: Float!
  }

  type OrderBook {
    lastUpdateId: Float!
    bids: [OrderBookEntry!]!
    asks: [OrderBookEntry!]!
  }

  type AggregateTrade {
    id: Float!
    price: Float!
    quantity: Float!
    firstId: Float!
    lastId: Float!
    timestamp: Float!
    isBuyerMaker: Boolean!
  }

  type Kline {
    openTime: Float!
    open: Float!
    high: Float!
    low: Float!
    close: Float!
    volume: Float!
    closeTime: Float!
    quoteAssetVolume: Float!
    numberOfTrades: Float!
  }

  type GlobalStats {
    lastUpdated: String!
    totalSymbols: Int!
    topGainers: [MarketTicker!]!
    topLosers: [MarketTicker!]!
    highestVolume: [MarketTicker!]!
    marketLeaders: [MarketTicker!]!
  }

  type Query {
    marketOverview(symbols: [String!]!, forceRefresh: Boolean = false): [MarketTicker!]!
    orderBook(symbol: String!, limit: Int = 20): OrderBook!
    aggregateTrades(symbol: String!, limit: Int = 50): [AggregateTrade!]!
    klines(symbol: String!, interval: String!, limit: Int = 50): [Kline!]!
    globalStats: GlobalStats!
    availableSymbols: [String!]!
  }
`;
