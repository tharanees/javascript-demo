const EventEmitter = require('events');

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
let cachedFetch = null;
let fetchInitialised = false;

const resolveFetch = async () => {
  if (fetchInitialised) {
    return cachedFetch;
  }

  fetchInitialised = true;

  if (typeof globalThis.fetch === 'function' && !proxyUrl) {
    cachedFetch = globalThis.fetch.bind(globalThis);
    return cachedFetch;
  }

  try {
    const { default: fetchFn } = await import('node-fetch');

    if (!proxyUrl) {
      cachedFetch = fetchFn;
      return cachedFetch;
    }

    const { HttpsProxyAgent } = await import('https-proxy-agent');
    const agent = new HttpsProxyAgent(proxyUrl);
    cachedFetch = (url, options = {}) => fetchFn(url, { ...options, agent });
    return cachedFetch;
  } catch (error) {
    if (typeof globalThis.fetch === 'function') {
      console.warn(`[dataService] node-fetch unavailable, falling back to global fetch: ${error.message}`);
      cachedFetch = globalThis.fetch.bind(globalThis);
      return cachedFetch;
    }

    throw error;
  }
};

const fetch = (...args) => resolveFetch().then((impl) => impl(...args));
const seedAssets = require('../data/seedAssets.json');

const MAX_HISTORY_POINTS = 288;

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const parseFloatStrict = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const sanitized = value.replace(/,/g, '').trim();
    if (!sanitized || sanitized === '--' || sanitized.toLowerCase() === 'n/a') {
      return null;
    }

    const parsed = Number.parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const parseFloatSafe = (value) => parseFloatStrict(value) ?? 0;

const findUsdQuote = (asset) => {
  if (!asset) {
    return null;
  }

  const directUsdQuote = asset?.quote?.USD || asset?.quote?.Usd || asset?.quote?.usd;
  if (directUsdQuote) {
    return directUsdQuote;
  }

  if (Array.isArray(asset?.quotes)) {
    return asset.quotes.find((entry) => {
      const code = entry?.symbol || entry?.name || entry?.currency || entry?.currencyCode;
      return code === 'USD';
    });
  }

  return null;
};

const getValueFromPath = (source, path) => {
  if (!source) {
    return undefined;
  }

  return path.reduce((accumulator, key) => {
    if (accumulator === null || accumulator === undefined) {
      return undefined;
    }
    return accumulator[key];
  }, source);
};

const pickNumeric = (sources, candidatePaths) => {
  for (const source of sources) {
    if (!source) {
      continue;
    }

    for (const candidate of candidatePaths) {
      const path = Array.isArray(candidate) ? candidate : [candidate];
      const value = getValueFromPath(source, path);
      const parsed = parseFloatStrict(value);
      if (parsed !== null) {
        return parsed;
      }
    }
  }

  return 0;
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

    try {
      const coinMarketCapAssets = await this.fetchCoinMarketCapAssets();
      const transformed = this.transformCoinMarketCapAssets(coinMarketCapAssets, timestamp);

      if (!transformed.length) {
        throw new Error('CoinMarketCap returned an empty dataset');
      }

      this.ingestAssets(transformed, timestamp, 'coinmarketcap', false);
    } catch (coinMarketCapError) {
      const errorMessage = coinMarketCapError.message;
      console.warn(`[dataService] Falling back to bundled dataset: ${errorMessage}`);

      const syntheticAssets = this.buildSyntheticAssets(timestamp);
      this.emit('fallback', { message: errorMessage });
      this.ingestAssets(syntheticAssets, timestamp, 'synthetic', true);
    } finally {
      this.isUpdating = false;
    }
  }

  async fetchCoinMarketCapAssets() {
    const limit = Math.min(this.maxAssets, 500);
    const params = new URLSearchParams({ start: '1', limit: String(limit), convert: 'USD' });
    const url = `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?${params.toString()}`;
    const headers = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      Origin: 'https://coinmarketcap.com',
      Referer: 'https://coinmarketcap.com/',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch CoinMarketCap assets: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();

    const status = payload?.status || payload?.data?.status;
    const errorCodeRaw = status?.error_code ?? status?.errorCode;
    const errorCode =
      typeof errorCodeRaw === 'string' ? Number.parseInt(errorCodeRaw, 10) : errorCodeRaw;

    if (Number.isFinite(errorCode) ? errorCode !== 0 : Boolean(errorCode)) {
      throw new Error(
        `CoinMarketCap error ${errorCodeRaw}: ${status?.error_message || status?.errorMessage || 'Unknown error'} (${status?.timestamp || 'unknown timestamp'})`,
      );
    }

    const assets = Array.isArray(payload?.data?.cryptoCurrencyList) ? payload.data.cryptoCurrencyList : [];

    if (!assets.length) {
      throw new Error('CoinMarketCap response did not include asset data');
    }

    return assets;
  }

  transformCoinMarketCapAssets(assets, timestamp) {
    return assets
      .map((asset, index) => {
        const usdQuote = findUsdQuote(asset);
        const priceUsd = pickNumeric([usdQuote, asset], [
          ['price'],
          ['quote'],
          ['priceUsd'],
          ['price_usd'],
          ['lastPrice'],
        ]);

        const supply = pickNumeric([asset, usdQuote], [
          ['circulating_supply'],
          ['circulatingSupply'],
          ['supply'],
        ]);

        const maxSupply = pickNumeric([asset, usdQuote], [
          ['max_supply'],
          ['maxSupply'],
          ['total_supply'],
          ['totalSupply'],
        ]);

        const marketCapUsd = pickNumeric([usdQuote, asset], [
          ['market_cap'],
          ['marketCap'],
          ['market_cap_diluted'],
          ['marketCapUsd'],
          ['market_cap_usd'],
        ]);

        const volumeUsd24Hr = pickNumeric([usdQuote, asset], [
          ['volume_24h'],
          ['volume24h'],
          ['volume24H'],
          ['volume'],
          ['volumeUsd24Hr'],
          ['volume_24H'],
        ]);

        const changePercent24Hr = pickNumeric([usdQuote, asset], [
          ['percent_change_24h'],
          ['percentChange24h'],
          ['change24h'],
          ['percentChange24H'],
          ['changePercent24h'],
          ['changePercent24Hr'],
        ]);

        const vwap24HrRaw = pickNumeric([usdQuote, asset], [
          ['vwap'],
          ['vwap24h'],
          ['vwap24H'],
        ]);
        const vwap24Hr = vwap24HrRaw > 0 ? vwap24HrRaw : priceUsd;

        const explorerFromUrls = [asset?.urls?.explorer, asset?.urls?.website]
          .filter(Array.isArray)
          .flat()
          .find((entry) => typeof entry === 'string' && entry.trim().length > 0);

        const explorer =
          explorerFromUrls || (asset?.slug ? `https://coinmarketcap.com/currencies/${asset.slug}/` : undefined);

        const baseAsset = asset?.symbol;
        const idSource = asset?.slug || (baseAsset ? baseAsset.toLowerCase() : String(asset?.id ?? index + 1));
        const id = `${idSource}-usd`;
        const rankCandidate = Number.parseInt(asset?.cmc_rank ?? asset?.cmcRank ?? asset?.rank, 10);
        const rank = Number.isFinite(rankCandidate) ? rankCandidate : index + 1;

        return {
          id,
          symbol: baseAsset,
          name: asset?.name ?? baseAsset,
          baseAsset,
          quoteAsset: 'USD',
          supply,
          maxSupply,
          marketCapUsd,
          volumeUsd24Hr,
          priceUsd,
          changePercent24Hr,
          vwap24Hr,
          explorer,
          lastUpdated: timestamp,
          rank,
        };
      })
      .filter((asset) => asset?.symbol && asset.priceUsd > 0)
      .slice(0, this.maxAssets);
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

  ingestAssets(assets, timestamp, source, usedFallback) {
    const nextMap = new Map();

    assets.forEach((asset, index) => {
      const rankValue = Number.parseInt(asset.rank, 10);
      const normalizedRank = Number.isFinite(rankValue) ? rankValue : index + 1;
      const normalized = this.normalizeAsset({ ...asset, rank: normalizedRank }, timestamp);
      nextMap.set(normalized.id, normalized);
      this.appendHistory(normalized.id, {
        timestamp,
        priceUsd: normalized.priceUsd,
        volumeUsd24Hr: normalized.volumeUsd24Hr,
        changePercent24Hr: normalized.changePercent24Hr,
      });
    });

    this.assetMap = nextMap;
    this.lastUpdated = timestamp;
    this.dataSource = source;

    this.emit('assets-updated', {
      assets: this.getAssets(),
      source: this.dataSource,
      usedFallback,
    });
  }

  normalizeAsset(asset, timestamp) {
    return {
      id: asset.id,
      rank: Number.parseInt(asset.rank, 10),
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
  }

  appendHistory(id, point) {
    const history = this.assetHistory.get(id) || [];
    history.push(point);
    if (history.length > MAX_HISTORY_POINTS) {
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
