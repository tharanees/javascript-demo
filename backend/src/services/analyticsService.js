const dataService = require('./dataService');

const toFixedNumber = (value, digits = 2) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Number.parseFloat(parsed.toFixed(digits));
};

function getMarketSummary() {
  const assets = dataService.getAssets();
  const totalMarketCap = assets.reduce((sum, asset) => sum + asset.marketCapUsd, 0);
  const totalVolume = assets.reduce((sum, asset) => sum + asset.volumeUsd24Hr, 0);
  const averageChange = assets.length
    ? assets.reduce((sum, asset) => sum + asset.changePercent24Hr, 0) / assets.length
    : 0;
  const positiveChangeCount = assets.filter((asset) => asset.changePercent24Hr >= 0).length;
  const negativeChangeCount = assets.length - positiveChangeCount;

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
  const assets = dataService.getAssets();
  const sorted = [...assets].sort((a, b) => b.changePercent24Hr - a.changePercent24Hr);
  return {
    gainers: sorted.slice(0, limit),
    losers: sorted.slice(-limit).reverse(),
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
    count: assets.filter((asset) => asset.changePercent24Hr >= bucket.min && asset.changePercent24Hr < bucket.max).length,
  }));

  return distribution;
}

function getDominance(limit = 6) {
  const assets = dataService.getAssets();
  const topAssets = assets.slice(0, limit);
  const totalMarketCap = topAssets.reduce((sum, asset) => sum + asset.marketCapUsd, 0);
  if (!totalMarketCap) {
    return [];
  }

  return topAssets.map((asset) => ({
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
      const delta = latest.priceUsd - previous.priceUsd;
      return Math.abs(delta / (previous.priceUsd || 1));
    });

  const averageVelocity = historySamples.length
    ? (historySamples.reduce((sum, value) => sum + value, 0) / historySamples.length) * 100
    : 0;

  return {
    averageVelocityPercent: toFixedNumber(averageVelocity, 2),
    sampleSize: historySamples.length,
  };
}

module.exports = {
  getMarketSummary,
  getTopMovers,
  getChangeDistribution,
  getDominance,
  getVelocityMetrics,
};
