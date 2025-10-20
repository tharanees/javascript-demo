const toNumber = (value) => Number(value ?? 0);

const mapTicker = (ticker) => ({
  symbol: ticker.symbol,
  priceChangePercent: toNumber(ticker.priceChangePercent),
  lastPrice: toNumber(ticker.lastPrice),
  openPrice: toNumber(ticker.openPrice),
  highPrice: toNumber(ticker.highPrice),
  lowPrice: toNumber(ticker.lowPrice),
  volume: toNumber(ticker.volume),
  quoteVolume: toNumber(ticker.quoteVolume),
});

const mapAggregateTrade = (trade) => ({
  id: trade.a,
  price: toNumber(trade.p),
  quantity: toNumber(trade.q),
  firstId: trade.f,
  lastId: trade.l,
  timestamp: trade.T,
  isBuyerMaker: trade.m,
});

const mapKline = (kline) => ({
  openTime: kline[0],
  open: toNumber(kline[1]),
  high: toNumber(kline[2]),
  low: toNumber(kline[3]),
  close: toNumber(kline[4]),
  volume: toNumber(kline[5]),
  closeTime: kline[6],
  quoteAssetVolume: toNumber(kline[7]),
  numberOfTrades: toNumber(kline[8]),
});

export const resolvers = {
  Query: {
    marketOverview: async (_, { symbols, forceRefresh }, { services }) => {
      if (!symbols.length) {
        throw new Error('At least one symbol is required');
      }

      if (forceRefresh) {
        services.binanceRest.clearTickerCache(symbols);
      }

      const tickers = await services.binanceRest.get24hTickers(symbols);
      return tickers.map(mapTicker);
    },
    orderBook: async (_, { symbol, limit }, { services }) => {
      const book = await services.binanceRest.getOrderBook(symbol, limit);
      return book;
    },
    aggregateTrades: async (_, { symbol, limit }, { services }) => {
      const trades = await services.binanceRest.getAggregateTrades(symbol, limit);
      return trades.map(mapAggregateTrade);
    },
    klines: async (_, { symbol, interval, limit }, { services }) => {
      const klines = await services.binanceRest.getKlines(symbol, interval, limit);
      return klines.map(mapKline);
    },
    globalStats: async (_, __, { services }) => {
      const stats = await services.binanceRest.getGlobalStats();
      return {
        ...stats,
        topGainers: stats.topGainers.map(mapTicker),
        topLosers: stats.topLosers.map(mapTicker),
        highestVolume: stats.highestVolume.map(mapTicker),
        marketLeaders: stats.marketLeaders.map(mapTicker),
      };
    },
    availableSymbols: async (_, __, { services }) => {
      const { symbols } = await services.binanceRest.getExchangeInfo();
      return symbols.map((item) => item.symbol);
    },
  },
};
