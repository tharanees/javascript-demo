import { gql } from '@apollo/client';

export const MARKET_SUMMARY = gql`
  query MarketSummary($symbol: String!) {
    marketSummary(symbol: $symbol) {
      symbol
      ticker {
        price
        priceChange
        priceChangePercent
        highPrice
        lowPrice
        openPrice
        volume
        quoteVolume
        bestBid
        bestAsk
      }
      depth {
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
      trades {
        eventTime
        price
        quantity
        isBuyerMaker
      }
      tradeVelocity
      buyVolume
      sellVolume
      imbalance
      lastTrade {
        eventTime
        price
        quantity
        isBuyerMaker
      }
      lastUpdated
      series {
        time
        close
      }
      volatility {
        variance
        standardDeviation
      }
    }
  }
`;

export const ASSET_METRICS = gql`
  query AssetMetrics($symbol: String!) {
    assetMetrics(symbol: $symbol) {
      symbol
      lastPrice
      priceChangePercent
      quoteVolume
      tradeVelocity
      buyVolume
      sellVolume
      imbalance
      momentum
      priceBands {
        highest
        lowest
        average
      }
      orderBook {
        bids {
          price
          quantity
        }
        asks {
          price
          quantity
        }
      }
      recentTrades
      klines
      largestTrade
      smallestTrade
    }
  }
`;

export const MARKET_LEADERS = gql`
  query MarketLeaders($limit: Int, $sortKey: String) {
    marketLeaders(limit: $limit, sortKey: $sortKey) {
      symbol
      price
      priceChangePercent
      volume
      quoteVolume
      weightedAvgPrice
      highPrice
      lowPrice
    }
  }
`;

export const GLOBAL_METRICS = gql`
  query GlobalMetrics {
    globalMetrics {
      totalVolume
      totalQuoteVolume
      advances
      decliners
      advanceDeclineRatio
      extremeMovers {
        symbol
        price
        priceChangePercent
        volume
        quoteVolume
        weightedAvgPrice
        highPrice
        lowPrice
      }
    }
  }
`;

export const SYMBOLS = gql`
  query Symbols($limit: Int) {
    symbols(limit: $limit)
  }
`;
