import axios from 'axios';
import NodeCache from 'node-cache';

const BASE_URL = 'https://api.binance.com/api/v3';

const DEFAULT_CACHE_TTL = 5; // seconds for frequent endpoints
const LONG_CACHE_TTL = 60; // seconds for less volatile data

const buildTickerCacheKey = (symbols) =>
  symbols.length ? `24hTicker:${symbols.sort().join(',')}` : '24hTicker:all';

export class BinanceRestService {
  constructor() {
    this.http = axios.create({
      baseURL: BASE_URL,
      timeout: 10_000,
    });

    this.cache = new NodeCache({ stdTTL: DEFAULT_CACHE_TTL, checkperiod: 60 });
  }

  clearTickerCache(symbols = []) {
    const cacheKey = buildTickerCacheKey(symbols);
    this.cache.del(cacheKey);
  }

  async get24hTickers(symbols = []) {
    const cacheKey = buildTickerCacheKey(symbols);

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { data } = await this.http.get('/ticker/24hr', {
      params: symbols.length ? { symbols: JSON.stringify(symbols) } : undefined,
    });

    const normalized = Array.isArray(data) ? data : [data];
    this.cache.set(cacheKey, normalized, DEFAULT_CACHE_TTL);
    return normalized;
  }

  async getOrderBook(symbol, limit = 20) {
    const cacheKey = `orderBook:${symbol}:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { data } = await this.http.get('/depth', {
      params: { symbol, limit: Math.min(Math.max(limit, 5), 5000) },
    });

    const orderBook = {
      ...data,
      bids: data.bids.map(([price, quantity]) => ({ price: Number(price), quantity: Number(quantity) })),
      asks: data.asks.map(([price, quantity]) => ({ price: Number(price), quantity: Number(quantity) })),
    };

    this.cache.set(cacheKey, orderBook, DEFAULT_CACHE_TTL);
    return orderBook;
  }

  async getAggregateTrades(symbol, limit = 50) {
    const cacheKey = `aggTrades:${symbol}:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { data } = await this.http.get('/aggTrades', {
      params: { symbol, limit: Math.min(Math.max(limit, 1), 1000) },
    });

    this.cache.set(cacheKey, data, 2);
    return data;
  }

  async getKlines(symbol, interval = '1m', limit = 50) {
    const cacheKey = `klines:${symbol}:${interval}:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { data } = await this.http.get('/klines', {
      params: {
        symbol,
        interval,
        limit: Math.min(Math.max(limit, 1), 1000),
      },
    });

    this.cache.set(cacheKey, data, LONG_CACHE_TTL);
    return data;
  }

  async getExchangeInfo() {
    const cacheKey = 'exchangeInfo';
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { data } = await this.http.get('/exchangeInfo');
    this.cache.set(cacheKey, data, LONG_CACHE_TTL);
    return data;
  }

  async getGlobalStats() {
    const tickers = await this.get24hTickers();

    const sortedByChange = [...tickers]
      .filter((ticker) => Number(ticker.volume) > 0)
      .sort((a, b) => Number(b.priceChangePercent) - Number(a.priceChangePercent));

    const sortedByVolume = [...tickers]
      .filter((ticker) => Number(ticker.quoteVolume) > 0)
      .sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume));

    return {
      lastUpdated: new Date().toISOString(),
      totalSymbols: tickers.length,
      topGainers: sortedByChange.slice(0, 5),
      topLosers: sortedByChange.slice(-5).reverse(),
      highestVolume: sortedByVolume.slice(0, 5),
      marketLeaders: sortedByVolume
        .filter((ticker) => ticker.symbol.endsWith('USDT'))
        .slice(0, 5),
    };
  }
}
