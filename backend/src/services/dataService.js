const EventEmitter = require('events');

const fetch = async (...args) => {
  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch(...args);
  }

  const { default: fetchFn } = await import('node-fetch');
  return fetchFn(...args);
};
const seedAssets = require('../data/seedAssets.json');

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const parseFloatSafe = (value) => {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const sanitized = value.replace(/,/g, '').trim();
    if (!sanitized || sanitized === '--' || sanitized.toLowerCase() === 'n/a') {
      return 0;
    }

    const parsed = Number.parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const normalizeQuote = (quote) => {
  if (typeof quote !== 'string') {
    return quote;
  }

  return quote.replaceAll('Ⓢ', '').toUpperCase();
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
    this.quoteAssetPreference = ['USDT', 'FDUSD', 'BUSD', 'USDC', 'TUSD', 'USDⓈ', 'USD'];
    this.quoteAssetPreferenceNormalized = this.quoteAssetPreference.map(normalizeQuote);
    this.supportedQuoteAssets = new Set(this.quoteAssetPreferenceNormalized);
    this.maxAssets = 400;
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
      const products = await this.fetchLiveProducts();
      assetPayload = this.transformBinanceProducts(products, timestamp);

      if (!assetPayload.length) {
        throw new Error('Received empty payload from Binance product API');
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

  async fetchLiveProducts() {
    const primaryUrl =
      'https://www.binance.com/bapi/asset/v2/public/asset-service/product/get-products?includeEtf=true';

    const tryPrimary = async () => {
      const response = await fetch(primaryUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch Binance products: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      const products = this.extractProducts(payload);
      if (products.length) {
        return products;
      }

      throw new Error('Primary Binance endpoint returned an empty dataset');
    };

    const tryPaginated = async () => {
      const aggregated = [];
      const pageSize = 500;
      for (let page = 1; page <= 5; page += 1) {
        const url = `https://www.binance.com/bapi/asset/v3/public/asset-service/product/list?page=${page}&rows=${pageSize}&includeEtf=true`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch Binance paginated products: ${response.status} ${response.statusText}`);
        }

        const payload = await response.json();
        const products = this.extractProducts(payload);
        if (!products.length) {
          break;
        }

        aggregated.push(...products);

        if (products.length < pageSize) {
          break;
        }
      }

      if (!aggregated.length) {
        throw new Error('Paginated Binance endpoint returned an empty dataset');
      }

      return aggregated;
    };

    try {
      return await tryPrimary();
    } catch (primaryError) {
      // eslint-disable-next-line no-console
      console.warn(`[dataService] Primary Binance endpoint failed: ${primaryError.message}`);
      return tryPaginated();
    }
  }

  extractProducts(payload) {
    if (!payload) {
      return [];
    }

    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(payload?.data?.list)) {
      return payload.data.list;
    }

    if (Array.isArray(payload?.data?.rows)) {
      return payload.data.rows;
    }

    if (Array.isArray(payload?.data?.products)) {
      return payload.data.products;
    }

    if (Array.isArray(payload?.data?.data)) {
      return payload.data.data;
    }

    return [];
  }

  transformBinanceProducts(products, timestamp) {
    const groupedByBase = new Map();

    products.forEach((product) => {
      const baseAsset = product?.b ?? product?.baseAsset ?? product?.symbol?.replace(/[^A-Z]/g, '');
      const quoteAsset = normalizeQuote(product?.q ?? product?.quoteAsset ?? product?.quote ?? product?.quoteToken);
      if (!baseAsset || !quoteAsset || !this.supportedQuoteAssets.has(quoteAsset)) {
        return;
      }

      const asset = this.buildAssetFromProduct(product, timestamp);
      if (!asset) {
        return;
      }

      const existing = groupedByBase.get(asset.baseAsset);
      if (!existing) {
        groupedByBase.set(asset.baseAsset, { asset, quoteAsset: asset.quoteAsset });
        return;
      }

      const existingPriority = this.quoteAssetPreferenceNormalized.indexOf(existing.quoteAsset);
      const currentPriority = this.quoteAssetPreferenceNormalized.indexOf(asset.quoteAsset);

      if (currentPriority !== -1 && (existingPriority === -1 || currentPriority < existingPriority)) {
        groupedByBase.set(asset.baseAsset, { asset, quoteAsset: asset.quoteAsset });
        return;
      }

      if (currentPriority === existingPriority && asset.volumeUsd24Hr > existing.asset.volumeUsd24Hr) {
        groupedByBase.set(asset.baseAsset, { asset, quoteAsset: asset.quoteAsset });
      }
    });

    const enriched = Array.from(groupedByBase.values()).map(({ asset }) => asset);

    enriched.sort((a, b) => {
      const aMetric = a.marketCapUsd > 0 ? a.marketCapUsd : a.volumeUsd24Hr;
      const bMetric = b.marketCapUsd > 0 ? b.marketCapUsd : b.volumeUsd24Hr;
      return bMetric - aMetric;
    });

    return enriched.slice(0, this.maxAssets).map((asset, index) => ({
      ...asset,
      rank: index + 1,
    }));
  }

  buildAssetFromProduct(product, timestamp) {
    const baseAsset = product?.b ?? product?.baseAsset ?? product?.base ?? product?.baseToken;
    const quoteAsset = normalizeQuote(product?.q ?? product?.quoteAsset ?? product?.quote ?? product?.quoteToken);

    if (!baseAsset || !quoteAsset) {
      return null;
    }

    const priceUsd = parseFloatSafe(
      product?.c ??
        product?.closePrice ??
        product?.close ??
        product?.price ??
        product?.lastPrice ??
        product?.priceUsd,
    );
    const changePercent = parseFloatSafe(
      product?.P ??
        product?.priceChangePercent ??
        product?.priceChangeRate ??
        product?.percentChange ??
        product?.priceChange,
    );
    const quoteVolume = parseFloatSafe(
      product?.qv ??
        product?.quoteVolume ??
        product?.volumeUsd ??
        product?.turnover ??
        product?.tradingVolume ??
        0,
    );
    const baseVolume = parseFloatSafe(product?.v ?? product?.volume ?? product?.baseVolume ?? 0);
    const supply = parseFloatSafe(product?.cs ?? product?.circulatingSupply ?? product?.supply);
    const maxSupply = parseFloatSafe(product?.ms ?? product?.maxSupply ?? product?.totalSupply) || supply;

    if (!priceUsd) {
      return null;
    }

    const displayName = product?.an || product?.assetName || `${baseAsset}/${quoteAsset}`;
    const marketCapFromSupply = supply > 0 ? priceUsd * supply : 0;
    const marketCapUsd =
      marketCapFromSupply || parseFloatSafe(product?.marketCap ?? product?.marketCapUsd ?? product?.mc) || quoteVolume;
    const vwap24Hr = baseVolume > 0 && quoteVolume > 0 ? quoteVolume / baseVolume : priceUsd;
    const explorer = `https://www.binance.com/en/trade/${baseAsset}_${quoteAsset}`;
    const id = `${baseAsset.toLowerCase()}-${quoteAsset.toLowerCase()}`;

    return {
      id,
      symbol: baseAsset,
      name: displayName,
      baseAsset,
      quoteAsset,
      supply,
      maxSupply,
      marketCapUsd,
      volumeUsd24Hr: quoteVolume,
      priceUsd,
      changePercent24Hr: changePercent,
      vwap24Hr,
      explorer,
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
        baseAsset: seed.symbol,
        quoteAsset: 'USD',
      };
    });
  }

  normalizeAsset(asset, timestamp) {
    const normalized = {
      id: asset.id,
      rank: parseInt(asset.rank, 10),
      symbol: asset.symbol,
      name: asset.name,
      baseAsset: asset.baseAsset,
      quoteAsset: asset.quoteAsset,
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
