const EventEmitter = require('events');

const fetch = (...args) => import('node-fetch').then(({ default: fetchFn }) => fetchFn(...args));
const seedAssets = require('../data/seedAssets.json');

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const toNumeric = (value) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const normalised = trimmed.replace(/,/g, '');
    const parsed = Number.parseFloat(normalised);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
    this.quoteAssetPreference = ['USDT', 'FDUSD', 'BUSD', 'USDC', 'TUSD', 'USD'];
    this.supportedQuoteAssets = new Set(this.quoteAssetPreference);
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
      const response = await fetch(
        'https://www.binance.com/bapi/asset/v2/public/asset-service/product/get-products?includeEtf=true',
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch Binance products: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      const products = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
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
        if (!Number.isFinite(normalized.priceUsd)) {
          return;
        }

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

  transformBinanceProducts(products, timestamp) {
    const groupedByBase = new Map();

    products.forEach((product) => {
      const baseAsset = product?.b ?? product?.baseAsset;
      const quoteAsset = product?.q ?? product?.quoteAsset;
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

      const existingPriority = this.quoteAssetPreference.indexOf(existing.quoteAsset);
      const currentPriority = this.quoteAssetPreference.indexOf(asset.quoteAsset);

      if (currentPriority !== -1 && (existingPriority === -1 || currentPriority < existingPriority)) {
        groupedByBase.set(asset.baseAsset, { asset, quoteAsset: asset.quoteAsset });
        return;
      }

      if (currentPriority === existingPriority) {
        const existingVolume = Number.isFinite(existing.asset.volumeUsd24Hr)
          ? existing.asset.volumeUsd24Hr
          : 0;
        const candidateVolume = Number.isFinite(asset.volumeUsd24Hr) ? asset.volumeUsd24Hr : 0;

        if (candidateVolume > existingVolume) {
          groupedByBase.set(asset.baseAsset, { asset, quoteAsset: asset.quoteAsset });
        }
      }
    });

    const enriched = Array.from(groupedByBase.values()).map(({ asset }) => asset);

    enriched.sort((a, b) => {
      const aMarketCap = Number.isFinite(a.marketCapUsd) ? a.marketCapUsd : null;
      const bMarketCap = Number.isFinite(b.marketCapUsd) ? b.marketCapUsd : null;
      const aVolume = Number.isFinite(a.volumeUsd24Hr) ? a.volumeUsd24Hr : 0;
      const bVolume = Number.isFinite(b.volumeUsd24Hr) ? b.volumeUsd24Hr : 0;
      const aMetric = aMarketCap && aMarketCap > 0 ? aMarketCap : aVolume;
      const bMetric = bMarketCap && bMarketCap > 0 ? bMarketCap : bVolume;
      return bMetric - aMetric;
    });

    return enriched.slice(0, 200).map((asset, index) => ({
      ...asset,
      rank: index + 1,
    }));
  }

  buildAssetFromProduct(product, timestamp) {
    const baseAsset = product?.b ?? product?.baseAsset;
    const quoteAsset = product?.q ?? product?.quoteAsset;

    const priceUsd = toNumeric(product?.c ?? product?.closePrice);
    const changePercent = toNumeric(product?.P ?? product?.priceChangePercent);
    const quoteVolume = toNumeric(product?.qv ?? product?.quoteVolume ?? product?.q);
    const baseVolume = toNumeric(product?.v ?? product?.volume);
    const supply = toNumeric(product?.cs ?? product?.circulatingSupply);
    const maxSupply = toNumeric(product?.ms ?? product?.maxSupply) ?? supply;

    if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
      return null;
    }

    const displayName = product?.an || product?.assetName || `${baseAsset}/${quoteAsset}`;
    const marketCapFromSupply = Number.isFinite(supply) && supply > 0 ? priceUsd * supply : null;
    const fallbackMarketCap = toNumeric(product?.marketCap);
    const marketCapUsd = marketCapFromSupply ?? fallbackMarketCap ?? quoteVolume ?? null;
    const vwap24Hr =
      Number.isFinite(baseVolume) && baseVolume > 0 && Number.isFinite(quoteVolume) && quoteVolume > 0
        ? quoteVolume / baseVolume
        : priceUsd;
    const explorer = `https://www.binance.com/en/trade/${baseAsset}_${quoteAsset}`;
    const id = `${baseAsset.toLowerCase()}-${quoteAsset.toLowerCase()}`;

    return {
      id,
      symbol: baseAsset,
      name: displayName,
      baseAsset,
      quoteAsset,
      supply: supply ?? null,
      maxSupply: maxSupply ?? null,
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
      const baselinePrice = Number.isFinite(previous?.priceUsd)
        ? previous.priceUsd
        : toNumeric(seed.priceUsd) ?? 0;
      const driftPercent = randomBetween(-1.5, 1.5);
      const priceUsd = Number.parseFloat((baselinePrice * (1 + driftPercent / 100)).toFixed(6));
      const supply = toNumeric(seed.supply) ?? 0;
      const marketCapUsd = Number.parseFloat((priceUsd * supply).toFixed(2));
      const baseVolume = toNumeric(seed.volumeUsd24Hr) ?? 0;
      const volumeUsd24Hr = Number.parseFloat((baseVolume * (1 + randomBetween(-0.25, 0.25))).toFixed(2));
      const previousChange = Number.isFinite(previous?.changePercent24Hr)
        ? previous.changePercent24Hr
        : toNumeric(seed.changePercent24Hr) ?? 0;
      const changePercent24Hr = Number.parseFloat((previousChange * 0.6 + driftPercent * 0.4).toFixed(2));
      const vwapBase =
        hasExistingAssets && Number.isFinite(previous?.priceUsd)
          ? (previous.priceUsd + priceUsd) / 2
          : toNumeric(seed.vwap24Hr) ?? priceUsd;
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
    const rankValue = Number.parseInt(asset.rank, 10);
    const normalized = {
      id: asset.id,
      rank: Number.isFinite(rankValue) ? rankValue : null,
      symbol: asset.symbol,
      name: asset.name,
      baseAsset: asset.baseAsset,
      quoteAsset: asset.quoteAsset,
      supply: toNumeric(asset.supply),
      maxSupply: toNumeric(asset.maxSupply),
      marketCapUsd: toNumeric(asset.marketCapUsd),
      volumeUsd24Hr: toNumeric(asset.volumeUsd24Hr),
      priceUsd: toNumeric(asset.priceUsd),
      changePercent24Hr: toNumeric(asset.changePercent24Hr),
      vwap24Hr: toNumeric(asset.vwap24Hr),
      explorer: asset.explorer,
      lastUpdated: timestamp,
    };

    return normalized;
  }

  appendHistory(id, point) {
    if (
      !Number.isFinite(point.priceUsd) ||
      !Number.isFinite(point.volumeUsd24Hr) ||
      !Number.isFinite(point.changePercent24Hr)
    ) {
      return;
    }

    const history = this.assetHistory.get(id) || [];
    history.push(point);
    if (history.length > 288) {
      history.shift();
    }
    this.assetHistory.set(id, history);
  }

  getAssets() {
    return Array.from(this.assetMap.values())
      .filter((asset) => Number.isFinite(asset.priceUsd))
      .sort((a, b) => (Number.isFinite(a.rank) && Number.isFinite(b.rank) ? a.rank - b.rank : 0));
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
