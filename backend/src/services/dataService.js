const EventEmitter = require('events');

const fetch = (...args) => import('node-fetch').then(({ default: fetchFn }) => fetchFn(...args));
const seedAssets = require('../data/seedAssets.json');

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const parseFloatSafe = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

class DataService extends EventEmitter {
  constructor() {
    super();
    this.assetMap = new Map();
    this.assetHistory = new Map();
    this.lastUpdated = null;
    this.isUpdating = false;
    this.intervalHandle = null;
    this.dataSource = 'uninitialised';
    this.exchangeInfo = new Map();
    this.exchangeInfoLoaded = false;
    this.supportedQuoteAssets = new Set(['USDT', 'BUSD', 'USDC', 'FDUSD', 'TUSD', 'USD']);
  }

  async start(intervalMs = 15000) {
    await this.updateData();
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
    this.intervalHandle = setInterval(() => this.updateData(), intervalMs);
  }

  stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  async updateData() {
    if (this.isUpdating) {
      return;
    }

    this.isUpdating = true;

    const timestamp = Date.now();
    let assetPayload = [];
    let usedFallback = false;

    try {
      await this.ensureExchangeInfo();

      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      if (!response.ok) {
        throw new Error(`Failed to fetch Binance tickers: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      assetPayload = this.transformBinanceTickers(Array.isArray(payload) ? payload : [], timestamp);

      if (!assetPayload.length) {
        throw new Error('Received empty payload from Binance API');
      }

      this.dataSource = 'binance';
    } catch (error) {
      usedFallback = true;
      // eslint-disable-next-line no-console
      console.warn(`[dataService] Falling back to bundled dataset: ${error.message}`);
      assetPayload = this.buildSyntheticAssets(timestamp);
      this.dataSource = 'synthetic';
      this.emit('fallback', { message: error.message });
    }

    if (assetPayload.length) {
      assetPayload.forEach((asset, index) => {
        const normalized = this.normalizeAsset({ ...asset, rank: asset.rank ?? index + 1 }, timestamp);
        this.assetMap.set(normalized.id, normalized);
        this.appendHistory(normalized.id, {
          timestamp,
          priceUsd: normalized.priceUsd,
          volumeUsd24Hr: normalized.volumeUsd24Hr,
          changePercent24Hr: normalized.changePercent24Hr,
        });
      });

      this.lastUpdated = timestamp;
      this.emit('assets-updated', { assets: this.getAssets(), source: this.dataSource, usedFallback });
    }

    this.isUpdating = false;
  }

  async ensureExchangeInfo() {
    if (this.exchangeInfoLoaded && this.exchangeInfo.size > 0) {
      return;
    }

    try {
      const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange info: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      const symbols = Array.isArray(payload?.symbols) ? payload.symbols : [];

      if (!symbols.length) {
        throw new Error('Exchange info payload was empty');
      }

      this.exchangeInfo = new Map(symbols.map((symbol) => [symbol.symbol, symbol]));
      this.exchangeInfoLoaded = true;
    } catch (error) {
      this.exchangeInfoLoaded = false;
      throw error;
    }
  }

  transformBinanceTickers(tickers, timestamp) {
    const enriched = tickers
      .map((ticker) => this.buildAssetFromTicker(ticker, timestamp))
      .filter((asset) => asset !== null);

    enriched.sort((a, b) => b.marketCapUsd - a.marketCapUsd);

    return enriched.slice(0, 200).map((asset, index) => ({
      ...asset,
      rank: index + 1,
    }));
  }

  buildAssetFromTicker(ticker, timestamp) {
    const meta = this.exchangeInfo.get(ticker.symbol);
    if (!meta || !this.supportedQuoteAssets.has(meta.quoteAsset)) {
      return null;
    }

    const baseAsset = meta.baseAsset;
    const quoteAsset = meta.quoteAsset;

    const priceUsd = parseFloatSafe(ticker.lastPrice);
    const quoteVolume = parseFloatSafe(ticker.quoteVolume);
    const changePercent = parseFloatSafe(ticker.priceChangePercent);
    const vwap24Hr = parseFloatSafe(ticker.weightedAvgPrice);

    if (!priceUsd || !quoteVolume) {
      return null;
    }

    const id = `${baseAsset.toLowerCase()}-${quoteAsset.toLowerCase()}`;

    return {
      id,
      symbol: baseAsset,
      name: `${baseAsset}/${quoteAsset}`,
      supply: 0,
      maxSupply: 0,
      marketCapUsd: quoteVolume,
      volumeUsd24Hr: quoteVolume,
      priceUsd,
      changePercent24Hr: changePercent,
      vwap24Hr,
      explorer: '',
      lastUpdated: timestamp,
    };
  }

  buildSyntheticAssets(timestamp) {
    const hasExistingAssets = this.assetMap.size > 0;

    return seedAssets.map((seed) => {
      const previous = this.assetMap.get(seed.id);
      const baselinePrice = previous ? previous.priceUsd : parseFloatSafe(seed.priceUsd);
      const driftPercent = randomBetween(-1.5, 1.5);
      const priceUsd = Number.parseFloat((baselinePrice * (1 + driftPercent / 100)).toFixed(6));
      const supply = parseFloatSafe(seed.supply);
      const marketCapUsd = Number.parseFloat((priceUsd * supply).toFixed(2));
      const baseVolume = parseFloatSafe(seed.volumeUsd24Hr);
      const volumeUsd24Hr = Number.parseFloat((baseVolume * (1 + randomBetween(-0.25, 0.25))).toFixed(2));
      const previousChange = previous ? previous.changePercent24Hr : parseFloatSafe(seed.changePercent24Hr);
      const changePercent24Hr = Number.parseFloat((previousChange * 0.6 + driftPercent * 0.4).toFixed(2));
      const vwapBase = hasExistingAssets && previous ? (previous.priceUsd + priceUsd) / 2 : parseFloatSafe(seed.vwap24Hr);
      const vwap24Hr = Number.parseFloat(vwapBase.toFixed(6));

      return {
        ...seed,
        priceUsd,
        marketCapUsd,
        volumeUsd24Hr,
        changePercent24Hr,
        vwap24Hr,
        lastUpdated: timestamp,
      };
    });
  }

  normalizeAsset(asset, timestamp) {
    const normalized = {
      id: asset.id,
      rank: parseInt(asset.rank, 10),
      symbol: asset.symbol,
      name: asset.name,
      supply: parseFloatSafe(asset.supply),
      maxSupply: parseFloatSafe(asset.maxSupply),
      marketCapUsd: parseFloatSafe(asset.marketCapUsd),
      volumeUsd24Hr: parseFloatSafe(asset.volumeUsd24Hr),
      priceUsd: parseFloatSafe(asset.priceUsd),
      changePercent24Hr: parseFloatSafe(asset.changePercent24Hr),
      vwap24Hr: parseFloatSafe(asset.vwap24Hr),
      explorer: asset.explorer,
      lastUpdated: timestamp,
    };

    return normalized;
  }

  appendHistory(id, point) {
    const history = this.assetHistory.get(id) || [];
    history.push(point);
    if (history.length > 288) {
      history.shift();
    }
    this.assetHistory.set(id, history);
  }

  getAssets() {
    return Array.from(this.assetMap.values()).sort((a, b) => a.rank - b.rank);
  }

  getAsset(id) {
    return this.assetMap.get(id);
  }

  getHistory(id) {
    return this.assetHistory.get(id) || [];
  }

  getLastUpdated() {
    return this.lastUpdated;
  }

  getDataSource() {
    return this.dataSource;
  }
}

module.exports = new DataService();
