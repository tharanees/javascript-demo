import { gql } from '@apollo/client';

export const MARKET_OVERVIEW_QUERY = gql`
  query MarketOverview($symbols: [String!]!, $forceRefresh: Boolean) {
    marketOverview(symbols: $symbols, forceRefresh: $forceRefresh) {
      symbol
      priceChangePercent
      lastPrice
      openPrice
      highPrice
      lowPrice
      volume
      quoteVolume
    }
  }
`;

export const GLOBAL_STATS_QUERY = gql`
  query GlobalStats {
    globalStats {
      lastUpdated
      totalSymbols
      topGainers {
        symbol
        priceChangePercent
        lastPrice
      }
      topLosers {
        symbol
        priceChangePercent
        lastPrice
      }
      highestVolume {
        symbol
        quoteVolume
        lastPrice
      }
      marketLeaders {
        symbol
        priceChangePercent
        lastPrice
      }
    }
  }
`;

export const ORDER_BOOK_QUERY = gql`
  query OrderBook($symbol: String!, $limit: Int) {
    orderBook(symbol: $symbol, limit: $limit) {
      lastUpdateId
      bids {
        price
        quantity
      }
      asks {
        price
        quantity
      }
    }
  }
`;

export const AGG_TRADES_QUERY = gql`
  query AggregateTrades($symbol: String!, $limit: Int) {
    aggregateTrades(symbol: $symbol, limit: $limit) {
      id
      price
      quantity
      timestamp
      isBuyerMaker
    }
  }
`;

export const KLINES_QUERY = gql`
  query Klines($symbol: String!, $interval: String!, $limit: Int) {
    klines(symbol: $symbol, interval: $interval, limit: $limit) {
      openTime
      open
      high
      low
      close
      volume
    }
  }
`;

export const AVAILABLE_SYMBOLS_QUERY = gql`
  query AvailableSymbols {
    availableSymbols
  }
`;
