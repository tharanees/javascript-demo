const axios = require('axios');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const { groupBy, sumBy, maxBy, minBy } = require('lodash');
const config = require('../config');
const TimedCache = require('../utils/cache');
const logger = require('../utils/logger');

class BinanceService {
  constructor() {
    this.http = axios.create({
      baseURL: config.binance.restBaseUrl,
      timeout: 5000
    });

    this.eventBus = new EventEmitter();
    this.cache = new TimedCache(config.cache.defaultTtl);
    this.streams = new Map();
    this.marketState = new Map();
  }

  async initialize() {
    await this.ensureExchangeInfo();
    await Promise.all(config.binance.defaultSymbols.map((symbol) => this.ensureStream(symbol)));
    logger.info('Binance service initialized for symbols:', Array.from(this.streams.keys()).join(', '));
  }

  async ensureExchangeInfo() {
    return this.cache.wrap('exchangeInfo', config.cache.symbolTtl, async () => {
      const { data } = await this.http.get('/api/v3/exchangeInfo');
      const symbols = data.symbols
        .filter((s) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
        .map((s) => s.symbol);
      return { raw: data, symbols };
    });
  }

  async fetch24hTickers(symbols) {
    const key = `tickers-${symbols.sort().join(',')}`;
    return this.cache.wrap(key, config.cache.defaultTtl, async () => {
      const { data } = await this.http.get('/api/v3/ticker/24hr', {
        params: { symbols: JSON.stringify(symbols) }
      });
      return data;
    });
  }

  async getOrderBook(symbol, limit = 50) {
    const cacheKey = `orderBook-${symbol}-${limit}`;
    return this.cache.wrap(cacheKey, config.cache.defaultTtl, async () => {
      const { data } = await this.http.get('/api/v3/depth', {
        params: { symbol, limit }
      });
      return data;
    });
  }

  async getRecentTrades(symbol, limit = 100) {
    const cacheKey = `trades-${symbol}-${limit}`;
    return this.cache.wrap(cacheKey, config.cache.defaultTtl, async () => {
      const { data } = await this.http.get('/api/v3/trades', {
        params: { symbol, limit }
      });
      return data;
    });
  }

  async getKlines(symbol, interval = '1m', limit = 120) {
    const cacheKey = `klines-${symbol}-${interval}-${limit}`;
    return this.cache.wrap(cacheKey, config.cache.defaultTtl, async () => {
      const { data } = await this.http.get('/api/v3/klines', {
        params: { symbol, interval, limit }
      });
      return data.map(([openTime, open, high, low, close, volume, closeTime, quoteAssetVolume]) => ({
        openTime,
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: Number(volume),
        closeTime,
        quoteVolume: Number(quoteAssetVolume)
      }));
    });
  }

  marketSnapshot(symbol) {
    const state = this.marketState.get(symbol);
    if (!state) {
      return null;
    }

    const now = Date.now();
    const trades = state.trades || [];
    const recentTrades = trades.filter((trade) => now - trade.eventTime <= 60 * 1000);
    const tradeVelocity = recentTrades.length;
    const buySellGroups = groupBy(recentTrades, (trade) => (trade.isBuyerMaker ? 'sell' : 'buy'));
    const buyVolume = sumBy(buySellGroups.buy || [], 'quantity');
    const sellVolume = sumBy(buySellGroups.sell || [], 'quantity');
    const lastTrade = trades[trades.length - 1];

    return {
      symbol,
      ticker: state.ticker,
      depth: state.depth,
      trades,
      tradeVelocity,
      buyVolume,
      sellVolume,
      imbalance: buyVolume - sellVolume,
      lastTrade,
      lastUpdated: state.lastUpdated
    };
  }

  async ensureStream(symbol) {
    const normalized = symbol.toUpperCase();
    if (this.streams.has(normalized)) {
      return this.streams.get(normalized);
    }

    const stream = this.createStream(normalized);
    this.streams.set(normalized, stream);
    return stream;
  }

  createStream(symbol) {
    const lower = symbol.toLowerCase();
    const streams = [`${lower}@ticker`, `${lower}@trade`, `${lower}@depth5@100ms`];
    const url = `${config.binance.wsBaseUrl}/stream?streams=${streams.join('/')}`;
    const ws = new WebSocket(url);
    const state = {
      ticker: null,
      depth: { bids: [], asks: [] },
      trades: [],
      lastUpdated: Date.now()
    };

    const handleMessage = (raw) => {
      try {
        const payload = JSON.parse(raw);
        const { stream: streamType, data } = payload;
        if (!data) {
          return;
        }

        if (streamType.endsWith('@ticker')) {
          state.ticker = {
            eventTime: data.E,
            price: Number(data.c),
            priceChange: Number(data.p),
            priceChangePercent: Number(data.P),
            highPrice: Number(data.h),
            lowPrice: Number(data.l),
            openPrice: Number(data.o),
            volume: Number(data.v),
            quoteVolume: Number(data.q),
            bestBid: Number(data.b),
            bestAsk: Number(data.a)
          };
        } else if (streamType.endsWith('@trade')) {
          const trade = {
            eventTime: data.T,
            price: Number(data.p),
            quantity: Number(data.q),
            isBuyerMaker: data.m
          };
          state.trades.push(trade);
          if (state.trades.length > 250) {
            state.trades.splice(0, state.trades.length - 250);
          }
        } else if (streamType.includes('@depth')) {
          state.depth = {
            lastUpdateId: data.u,
            bids: (data.b || []).map(([price, quantity]) => ({ price: Number(price), quantity: Number(quantity) })),
            asks: (data.a || []).map(([price, quantity]) => ({ price: Number(price), quantity: Number(quantity) }))
          };
        }

        state.lastUpdated = Date.now();
        this.marketState.set(symbol, state);
        this.eventBus.emit('market:update', { symbol, state: this.marketSnapshot(symbol) });
      } catch (error) {
        logger.warn('Failed to parse Binance stream payload', error.message);
      }
    };

    ws.on('open', () => logger.info(`WebSocket connected for ${symbol}`));
    ws.on('message', handleMessage);
    ws.on('close', () => {
      logger.warn(`WebSocket closed for ${symbol}, reconnecting...`);
      setTimeout(() => {
        const next = this.createStream(symbol);
        this.streams.set(symbol, next);
      }, 1000);
    });
    ws.on('error', (error) => {
      logger.error(`WebSocket error for ${symbol}`, error.message);
      ws.close();
    });

    return { ws, state };
  }

  on(event, handler) {
    this.eventBus.on(event, handler);
    return () => this.eventBus.off(event, handler);
  }

  getSymbols(limit = 50) {
    return this.ensureExchangeInfo().then((info) => info.symbols.slice(0, limit));
  }

  async getMarketLeaders(limit = 10, sortKey = 'priceChangePercent') {
    const info = await this.ensureExchangeInfo();
    const symbols = info.symbols.slice(0, 200);
    const tickers = await this.fetch24hTickers(symbols);
    const sorted = [...tickers].sort((a, b) => Number(b[sortKey]) - Number(a[sortKey]));
    return sorted.slice(0, limit).map((item) => ({
      symbol: item.symbol,
      price: Number(item.lastPrice),
      priceChangePercent: Number(item.priceChangePercent),
      volume: Number(item.volume),
      quoteVolume: Number(item.quoteVolume),
      weightedAvgPrice: Number(item.weightedAvgPrice),
      highPrice: Number(item.highPrice),
      lowPrice: Number(item.lowPrice)
    }));
  }

  async getMarketSummary(symbol) {
    await this.ensureStream(symbol);
    const snapshot = this.marketSnapshot(symbol);
    if (snapshot) {
      const klines = await this.getKlines(symbol, '1m', 60);
      const priceSeries = klines.map((k) => ({ time: k.closeTime, close: k.close }));
      const volatility = this.calculateVolatility(priceSeries);
      return {
        ...snapshot,
        series: priceSeries,
        volatility
      };
    }

    return null;
  }

  calculateVolatility(series) {
    if (!series || series.length < 2) {
      return { variance: 0, standardDeviation: 0 };
    }
    const returns = [];
    for (let i = 1; i < series.length; i += 1) {
      const prev = series[i - 1].close;
      const current = series[i].close;
      returns.push(Math.log(current / prev));
    }
    const mean = returns.reduce((acc, value) => acc + value, 0) / returns.length;
    const variance = returns.reduce((acc, value) => acc + (value - mean) ** 2, 0) / (returns.length - 1);
    return {
      variance,
      standardDeviation: Math.sqrt(variance)
    };
  }

  async getAssetMetrics(symbol) {
    await this.ensureStream(symbol);
    const snapshot = this.marketSnapshot(symbol);
    if (!snapshot || !snapshot.ticker) {
      return null;
    }

    const [orderBook, recentTrades, klines] = await Promise.all([
      this.getOrderBook(symbol, 50),
      this.getRecentTrades(symbol, 100),
      this.getKlines(symbol, '5m', 36)
    ]);

    const priceHistory = klines.map((k) => Number(k.close));
    const highest = Math.max(...priceHistory);
    const lowest = Math.min(...priceHistory);
    const average = priceHistory.reduce((acc, value) => acc + value, 0) / priceHistory.length;

    const momentum = priceHistory.slice(-5).map((price, index, arr) => {
      if (index === 0) return 0;
      return ((price - arr[index - 1]) / arr[index - 1]) * 100;
    });

    return {
      symbol,
      lastPrice: snapshot.ticker.price,
      priceChangePercent: snapshot.ticker.priceChangePercent,
      quoteVolume: snapshot.ticker.quoteVolume,
      tradeVelocity: snapshot.tradeVelocity,
      buyVolume: snapshot.buyVolume,
      sellVolume: snapshot.sellVolume,
      imbalance: snapshot.imbalance,
      orderBook,
      recentTrades,
      priceBands: {
        highest,
        lowest,
        average
      },
      momentum,
      klines,
      largestTrade: maxBy(recentTrades, (trade) => Number(trade.qty)),
      smallestTrade: minBy(recentTrades, (trade) => Number(trade.qty))
    };
  }

  async getGlobalMetrics() {
    const info = await this.ensureExchangeInfo();
    const symbols = info.symbols.slice(0, 200);
    const tickers = await this.fetch24hTickers(symbols);

    const totalQuoteVolume = tickers.reduce((acc, item) => acc + Number(item.quoteVolume), 0);
    const totalVolume = tickers.reduce((acc, item) => acc + Number(item.volume), 0);
    const advances = tickers.filter((item) => Number(item.priceChangePercent) > 0).length;
    const decliners = tickers.length - advances;
    const extremeMovers = tickers.filter((item) => Math.abs(Number(item.priceChangePercent)) > 10);

    return {
      totalVolume,
      totalQuoteVolume,
      advances,
      decliners,
      advanceDeclineRatio: decliners === 0 ? advances : advances / decliners,
      extremeMovers: extremeMovers.map((item) => ({
        symbol: item.symbol,
        price: Number(item.lastPrice),
        priceChangePercent: Number(item.priceChangePercent),
        volume: Number(item.volume),
        quoteVolume: Number(item.quoteVolume),
        weightedAvgPrice: Number(item.weightedAvgPrice),
        highPrice: Number(item.highPrice),
        lowPrice: Number(item.lowPrice)
      }))
    };
  }
}

module.exports = new BinanceService();
