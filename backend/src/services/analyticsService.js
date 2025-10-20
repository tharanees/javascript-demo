const dataService = require('./dataService');

const toFixedNumber = (value, digits = 2) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number.parseFloat(value.toFixed(digits));
};

function getMarketSummary() {
  const assets = dataService.getAssets();
  const totalMarketCap = assets.reduce(
    (sum, asset) => (Number.isFinite(asset.marketCapUsd) ? sum + asset.marketCapUsd : sum),
    0,
  );
  const totalVolume = assets.reduce(
    (sum, asset) => (Number.isFinite(asset.volumeUsd24Hr) ? sum + asset.volumeUsd24Hr : sum),
    0,
  );
  const assetsWithChange = assets.filter((asset) => Number.isFinite(asset.changePercent24Hr));
  const averageChange = assetsWithChange.length
    ? assetsWithChange.reduce((sum, asset) => sum + asset.changePercent24Hr, 0) / assetsWithChange.length
    : 0;
  const positiveChangeCount = assetsWithChange.filter((asset) => asset.changePercent24Hr >= 0).length;
  const negativeChangeCount = assetsWithChange.length - positiveChangeCount;

  return {
    totalMarketCapUsd: toFixedNumber(totalMarketCap, 0),
    totalVolumeUsd24Hr: toFixedNumber(totalVolume, 0),
    averageChangePercent24Hr: toFixedNumber(averageChange, 2),
    assetsTracked: assets.length,
    positiveChangeCount,
    negativeChangeCount,
    lastUpdated: dataService.getLastUpdated(),
    dataSource: dataService.getDataSource(),
  };
}

function getTopMovers(limit = 5) {
  const assets = dataService
    .getAssets()
    .filter((asset) => Number.isFinite(asset.changePercent24Hr));
  const sorted = [...assets].sort((a, b) => a.changePercent24Hr - b.changePercent24Hr);
  return {
    gainers: sorted.slice(-limit).reverse(),
    losers: sorted.slice(0, limit),
  };
}

function getChangeDistribution() {
  const buckets = [
    { label: '< -10%', min: Number.NEGATIVE_INFINITY, max: -10 },
    { label: '-10% to -5%', min: -10, max: -5 },
    { label: '-5% to 0%', min: -5, max: 0 },
    { label: '0% to 5%', min: 0, max: 5 },
    { label: '5% to 10%', min: 5, max: 10 },
    { label: '> 10%', min: 10, max: Number.POSITIVE_INFINITY },
  ];

  const assets = dataService.getAssets();
  const distribution = buckets.map((bucket) => ({
    label: bucket.label,
    count: assets.filter(
      (asset) =>
        Number.isFinite(asset.changePercent24Hr) &&
        asset.changePercent24Hr >= bucket.min &&
        asset.changePercent24Hr < bucket.max,
    ).length,
  }));

  return distribution;
}

function getDominance(limit = 6) {
  const assets = dataService.getAssets();
  const uniqueByBase = [];
  const seen = new Set();

  for (const asset of assets) {
    const key = asset.baseAsset || asset.symbol;
    if (seen.has(key)) {
      continue;
    }
    if (!Number.isFinite(asset.marketCapUsd) || asset.marketCapUsd <= 0) {
      continue;
    }

    seen.add(key);
    uniqueByBase.push(asset);
    if (uniqueByBase.length >= limit) {
      break;
    }
  }

  const totalMarketCap = uniqueByBase.reduce(
    (sum, asset) => (Number.isFinite(asset.marketCapUsd) ? sum + asset.marketCapUsd : sum),
    0,
  );
  if (!totalMarketCap) {
    return [];
  }

  return uniqueByBase.map((asset) => ({
    assetId: asset.id,
    symbol: asset.symbol,
    dominancePercent: toFixedNumber((asset.marketCapUsd / totalMarketCap) * 100, 2),
  }));
}

function getVelocityMetrics() {
  const assets = dataService.getAssets();
  const historySamples = assets
    .map((asset) => dataService.getHistory(asset.id))
    .filter((history) => history.length >= 2)
    .map((history) => {
      const latest = history[history.length - 1];
      const previous = history[history.length - 2];
      if (!Number.isFinite(latest.priceUsd) || !Number.isFinite(previous.priceUsd)) {
        return null;
      }

      const delta = latest.priceUsd - previous.priceUsd;
      const baseline = previous.priceUsd === 0 ? null : Math.abs(delta / previous.priceUsd);
      return Number.isFinite(baseline) ? baseline : null;
    });

  const numericSamples = historySamples.filter((value) => Number.isFinite(value));
  const averageVelocity = numericSamples.length
    ? (numericSamples.reduce((sum, value) => sum + value, 0) / numericSamples.length) * 100
    : 0;

  return {
    averageVelocityPercent: toFixedNumber(averageVelocity, 2),
    sampleSize: numericSamples.length,
  };
}

module.exports = {
  getMarketSummary,
  getTopMovers,
  getChangeDistribution,
  getDominance,
  getVelocityMetrics,
};
