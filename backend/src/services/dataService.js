const EventEmitter = require('events');

const fetch = (...args) => import('node-fetch').then(({ default: fetchFn }) => fetchFn(...args));

class DataService extends EventEmitter {
  constructor() {
    super();
    this.assetMap = new Map();
    this.assetHistory = new Map();
    this.lastUpdated = null;
    this.isUpdating = false;
    this.intervalHandle = null;
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
    try {
      const response = await fetch('https://api.coincap.io/v2/assets?limit=200');
      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.statusText}`);
      }
      const payload = await response.json();
      const { data } = payload;
      const timestamp = Date.now();

      data.forEach((asset) => {
        const normalized = this.normalizeAsset(asset, timestamp);
        this.assetMap.set(normalized.id, normalized);
        this.appendHistory(normalized.id, {
          timestamp,
          priceUsd: normalized.priceUsd,
          volumeUsd24Hr: normalized.volumeUsd24Hr,
          changePercent24Hr: normalized.changePercent24Hr,
        });
      });

      this.lastUpdated = timestamp;
      this.emit('assets-updated', this.getAssets());
    } catch (error) {
      this.emit('error', error);
    } finally {
      this.isUpdating = false;
    }
  }

  normalizeAsset(asset, timestamp) {
    const parseFloatSafe = (value) => {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

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
}

module.exports = new DataService();
